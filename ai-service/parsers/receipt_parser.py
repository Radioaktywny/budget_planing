"""
Receipt OCR parser using Tesseract.
"""
import re
import os
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter


class ReceiptParser:
    """Parser for receipt images using OCR."""
    
    def __init__(self):
        """Initialize receipt parser."""
        # Set Tesseract path from environment if provided
        tesseract_cmd = os.getenv('TESSERACT_CMD')
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    
    def parse_receipt(self, image_path: str) -> Dict:
        """
        Parse receipt image and extract transaction data.
        
        Args:
            image_path: Path to receipt image file
            
        Returns:
            Dictionary with transaction data and line items
        """
        # Preprocess image
        processed_image = self._preprocess_image(image_path)
        
        # Extract text using OCR
        text = pytesseract.image_to_string(processed_image)
        
        # Parse receipt data
        date = self._extract_date(text)
        total_amount = self._extract_total(text)
        items = self._extract_items(text)
        merchant = self._extract_merchant(text)
        
        # Build transaction data
        transaction = {
            "date": date or datetime.now().strftime('%Y-%m-%d'),
            "amount": total_amount or 0.0,
            "description": merchant or "Receipt Purchase",
            "type": "expense"
        }
        
        return {
            "transaction": transaction,
            "items": items,
            "raw_text": text
        }
    
    def _preprocess_image(self, image_path: str) -> Image.Image:
        """
        Preprocess image to improve OCR accuracy.
        
        Args:
            image_path: Path to image file
            
        Returns:
            Preprocessed PIL Image
        """
        # Open image
        image = Image.open(image_path)
        
        # Convert to grayscale
        image = image.convert('L')
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)
        
        # Enhance sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(2.0)
        
        # Apply threshold to get black and white image
        threshold = 128
        image = image.point(lambda p: p > threshold and 255)
        
        # Resize if too small (OCR works better with larger images)
        width, height = image.size
        if width < 1000:
            scale_factor = 1000 / width
            new_size = (int(width * scale_factor), int(height * scale_factor))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        return image
    
    def _extract_date(self, text: str) -> Optional[str]:
        """
        Extract date from receipt text.
        Supports both English and Polish date formats.
        
        Args:
            text: OCR extracted text
            
        Returns:
            Date in YYYY-MM-DD format or None
        """
        # Common date patterns on receipts (including Polish format)
        date_patterns = [
            r'(\d{1,2}\.\d{1,2}\.\d{2,4})',  # DD.MM.YYYY (Polish)
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',  # MM/DD/YYYY or DD/MM/YYYY
            r'(\d{4}[/-]\d{2}[/-]\d{2})',  # YYYY-MM-DD
            r'(\d{2}[/-]\d{2}[/-]\d{2})',  # MM/DD/YY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                date_str = match.group(1)
                parsed_date = self._parse_date(date_str)
                if parsed_date:
                    return parsed_date
        
        return None
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse date string into YYYY-MM-DD format. Supports Polish and English formats."""
        date_formats = [
            # Polish format (most common)
            '%d.%m.%Y', '%d.%m.%y',
            # English formats
            '%m/%d/%Y', '%m-%d-%Y',
            '%d/%m/%Y', '%d-%m-%Y',
            '%m/%d/%y', '%m-%d-%y',
            '%d/%m/%y', '%d-%m-%y',
            '%Y-%m-%d', '%Y/%m/%d',
        ]
        
        for fmt in date_formats:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        return None
    
    def _extract_total(self, text: str) -> Optional[float]:
        """
        Extract total amount from receipt text.
        
        Args:
            text: OCR extracted text
            
        Returns:
            Total amount or None
        """
        # Look for total keywords
        total_patterns = [
            r'(?:total|amount|sum|balance)\s*:?\s*\$?\s*([\d,]+\.?\d{0,2})',
            r'(?:grand\s+total|final\s+total)\s*:?\s*\$?\s*([\d,]+\.?\d{0,2})',
            r'\$\s*([\d,]+\.\d{2})\s*(?:total|$)',
        ]
        
        amounts = []
        
        for pattern in total_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    amount_str = match.group(1).replace(',', '')
                    amount = float(amount_str)
                    amounts.append(amount)
                except (ValueError, IndexError):
                    continue
        
        # Return the largest amount found (likely the total)
        if amounts:
            return max(amounts)
        
        # Fallback: find all amounts and return the largest
        all_amounts = re.findall(r'\$?\s*([\d,]+\.\d{2})', text)
        if all_amounts:
            try:
                amounts = [float(a.replace(',', '')) for a in all_amounts]
                return max(amounts)
            except ValueError:
                pass
        
        return None
    
    def _extract_items(self, text: str) -> List[Dict]:
        """
        Extract line items from receipt text.
        
        Args:
            text: OCR extracted text
            
        Returns:
            List of item dictionaries
        """
        items = []
        
        # Pattern to match item lines: description followed by amount
        # Example: "MILK 2% 1GAL    $3.99"
        item_pattern = r'([A-Za-z][A-Za-z0-9\s\-/]+?)\s+\$?\s*([\d,]+\.\d{2})'
        
        matches = re.finditer(item_pattern, text, re.MULTILINE)
        
        for match in matches:
            try:
                description = match.group(1).strip()
                amount_str = match.group(2).replace(',', '')
                amount = float(amount_str)
                
                # Filter out likely non-item lines
                if self._is_likely_item(description, amount):
                    items.append({
                        "description": description,
                        "amount": amount
                    })
            except (ValueError, IndexError):
                continue
        
        return items
    
    def _is_likely_item(self, description: str, amount: float) -> bool:
        """
        Check if a line is likely an item (not a total or tax).
        
        Args:
            description: Item description
            amount: Item amount
            
        Returns:
            True if likely an item
        """
        # Exclude common non-item keywords
        exclude_keywords = [
            'total', 'subtotal', 'tax', 'amount', 'balance', 'change',
            'cash', 'credit', 'debit', 'payment', 'tender', 'due'
        ]
        
        description_lower = description.lower()
        
        for keyword in exclude_keywords:
            if keyword in description_lower:
                return False
        
        # Exclude very short descriptions
        if len(description) < 3:
            return False
        
        # Exclude amounts that are too large (likely totals)
        if amount > 1000:
            return False
        
        return True
    
    def _extract_merchant(self, text: str) -> Optional[str]:
        """
        Extract merchant/store name from receipt text.
        
        Args:
            text: OCR extracted text
            
        Returns:
            Merchant name or None
        """
        # Merchant name is usually in the first few lines
        lines = text.split('\n')[:5]
        
        for line in lines:
            line = line.strip()
            # Look for lines with reasonable length and mostly letters
            if 3 <= len(line) <= 50:
                # Check if line has mostly letters (merchant name)
                letter_count = sum(c.isalpha() for c in line)
                if letter_count / len(line) > 0.5:
                    return line
        
        return None
