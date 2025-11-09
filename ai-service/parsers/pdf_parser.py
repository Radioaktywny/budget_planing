"""
PDF bank statement parser using PyPDF2 and pdfplumber.
"""
import re
from datetime import datetime
from typing import List, Dict, Optional
import PyPDF2
import pdfplumber


class PDFParser:
    """Parser for bank statement PDFs."""
    
    # Common transaction patterns (supports both English and Polish formats)
    TRANSACTION_PATTERNS = [
        # Polish date format: DD.MM.YYYY with amount (comma or period decimal)
        r'(\d{1,2}\.\d{1,2}\.\d{2,4})\s+(.+?)\s+([+-]?\s*[\d\s]+[,.]?\d{0,2})\s*(?:PLN|zł)?',
        # Date Amount Description pattern (MM/DD/YYYY or DD/MM/YYYY)
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+([+-]?\$?\s*[\d,]+\.?\d*)\s+(.+?)(?=\d{1,2}[/-]|\n|$)',
        # Date Description Amount pattern
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+([+-]?\$?\s*[\d,]+\.?\d{2})',
        # YYYY-MM-DD format
        r'(\d{4}-\d{2}-\d{2})\s+(.+?)\s+([+-]?\$?\s*[\d,]+\.?\d{2})',
        # Polish format with spaces in amounts: DD.MM.YYYY Description Amount
        r'(\d{1,2}\.\d{1,2}\.\d{4})\s+(.+?)\s+([+-]?\s*[\d\s]+,\d{2})',
    ]
    
    def __init__(self):
        """Initialize PDF parser."""
        pass
    
    def parse_pdf(self, file_path: str) -> List[Dict]:
        """
        Parse PDF file and extract transactions.
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            List of transaction dictionaries
        """
        transactions = []
        
        # Try pdfplumber first (better for tables)
        try:
            transactions = self._parse_with_pdfplumber(file_path)
            if transactions:
                return transactions
        except Exception as e:
            print(f"pdfplumber parsing failed: {e}")
        
        # Fallback to PyPDF2
        try:
            transactions = self._parse_with_pypdf2(file_path)
        except Exception as e:
            print(f"PyPDF2 parsing failed: {e}")
        
        return transactions
    
    def _parse_with_pdfplumber(self, file_path: str) -> List[Dict]:
        """Parse PDF using pdfplumber (better for structured tables)."""
        transactions = []
        
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    page_transactions = self._extract_transactions_from_text(text)
                    transactions.extend(page_transactions)
        
        return transactions
    
    def _parse_with_pypdf2(self, file_path: str) -> List[Dict]:
        """Parse PDF using PyPDF2 (fallback method)."""
        transactions = []
        
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    page_transactions = self._extract_transactions_from_text(text)
                    transactions.extend(page_transactions)
        
        return transactions
    
    def _extract_transactions_from_text(self, text: str) -> List[Dict]:
        """
        Extract transaction data from text using pattern matching.
        
        Args:
            text: Extracted text from PDF
            
        Returns:
            List of transaction dictionaries
        """
        transactions = []
        
        # Try each pattern
        for pattern in self.TRANSACTION_PATTERNS:
            matches = re.finditer(pattern, text, re.MULTILINE)
            
            for match in matches:
                try:
                    transaction = self._parse_transaction_match(match)
                    if transaction:
                        transactions.append(transaction)
                except Exception as e:
                    print(f"Error parsing transaction: {e}")
                    continue
        
        # Remove duplicates based on date, amount, and description
        transactions = self._deduplicate_transactions(transactions)
        
        return transactions
    
    def _parse_transaction_match(self, match: re.Match) -> Optional[Dict]:
        """
        Parse a regex match into a transaction dictionary.
        
        Args:
            match: Regex match object
            
        Returns:
            Transaction dictionary or None
        """
        groups = match.groups()
        
        if len(groups) < 3:
            return None
        
        # Determine which group is date, amount, description
        date_str = groups[0]
        
        # Check if second group is amount or description
        if self._is_amount(groups[1]):
            amount_str = groups[1]
            description = groups[2].strip()
        else:
            description = groups[1].strip()
            amount_str = groups[2]
        
        # Parse date
        parsed_date = self._parse_date(date_str)
        if not parsed_date:
            return None
        
        # Parse amount
        amount = self._parse_amount(amount_str)
        if amount is None:
            return None
        
        # Determine transaction type
        transaction_type = "expense" if amount < 0 else "income"
        amount = abs(amount)
        
        # Clean description
        description = self._clean_description(description)
        
        return {
            "date": parsed_date,
            "amount": amount,
            "description": description,
            "type": transaction_type
        }
    
    def _is_amount(self, text: str) -> bool:
        """Check if text looks like an amount."""
        # Remove common currency symbols and whitespace
        cleaned = text.replace('$', '').replace(',', '').strip()
        try:
            float(cleaned)
            return True
        except ValueError:
            return False
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """
        Parse date string into YYYY-MM-DD format.
        Supports both English and Polish date formats.
        
        Args:
            date_str: Date string in various formats
            
        Returns:
            Date in YYYY-MM-DD format or None
        """
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
    
    def _parse_amount(self, amount_str: str) -> Optional[float]:
        """
        Parse amount string into float.
        Supports both English (period) and Polish (comma) decimal separators.
        
        Args:
            amount_str: Amount string with possible currency symbols
            
        Returns:
            Float amount or None
        """
        try:
            # Remove currency symbols (both $ and PLN/zł)
            cleaned = amount_str.replace('$', '').replace('PLN', '').replace('zł', '').strip()
            
            # Remove spaces (Polish format often has spaces in large numbers)
            cleaned = cleaned.replace(' ', '')
            
            # Determine if using comma or period as decimal separator
            # Polish uses comma (,) as decimal separator and space/period as thousands separator
            # English uses period (.) as decimal separator and comma as thousands separator
            
            has_comma = ',' in cleaned
            has_period = '.' in cleaned
            
            if has_comma and has_period:
                # Both present - determine which is decimal separator
                comma_pos = cleaned.rfind(',')
                period_pos = cleaned.rfind('.')
                
                if comma_pos > period_pos:
                    # Comma is decimal separator (Polish format: 1.234,56)
                    cleaned = cleaned.replace('.', '').replace(',', '.')
                else:
                    # Period is decimal separator (English format: 1,234.56)
                    cleaned = cleaned.replace(',', '')
            elif has_comma:
                # Only comma present
                # Check if it's followed by exactly 2 digits (decimal separator)
                # or more than 2 digits (thousands separator)
                comma_pos = cleaned.rfind(',')
                after_comma = cleaned[comma_pos + 1:]
                
                if len(after_comma) == 2 and after_comma.isdigit():
                    # Polish decimal separator: 149,06
                    cleaned = cleaned.replace(',', '.')
                elif len(after_comma) > 2:
                    # Thousands separator: 1,234 (remove it)
                    cleaned = cleaned.replace(',', '')
                else:
                    # Assume decimal separator
                    cleaned = cleaned.replace(',', '.')
            elif has_period:
                # Only period present
                # Check if it's followed by exactly 2 digits (decimal separator)
                period_pos = cleaned.rfind('.')
                after_period = cleaned[period_pos + 1:]
                
                if len(after_period) == 2 and after_period.isdigit():
                    # Decimal separator: 149.06
                    pass  # Keep as is
                elif len(after_period) > 2:
                    # Thousands separator: 1.234 (remove it)
                    cleaned = cleaned.replace('.', '')
                # else keep as is
            
            # Handle negative amounts (withdrawals/expenses)
            is_negative = False
            if cleaned.startswith('-') or cleaned.startswith('('):
                is_negative = True
                cleaned = cleaned.replace('(', '').replace(')', '').replace('-', '').strip()
            elif cleaned.startswith('+'):
                cleaned = cleaned[1:].strip()
            
            amount = float(cleaned)
            
            if is_negative:
                amount = -amount
            
            return amount
        except ValueError:
            return None
    
    def _clean_description(self, description: str) -> str:
        """
        Clean and normalize transaction description.
        
        Args:
            description: Raw description text
            
        Returns:
            Cleaned description
        """
        # Remove extra whitespace
        description = ' '.join(description.split())
        
        # Remove common noise
        noise_patterns = [
            r'\s+\d+$',  # Trailing numbers
            r'^\d+\s+',  # Leading numbers
        ]
        
        for pattern in noise_patterns:
            description = re.sub(pattern, '', description)
        
        # Limit length
        if len(description) > 200:
            description = description[:200]
        
        return description.strip()
    
    def _deduplicate_transactions(self, transactions: List[Dict]) -> List[Dict]:
        """
        Remove duplicate transactions.
        
        Args:
            transactions: List of transaction dictionaries
            
        Returns:
            Deduplicated list
        """
        seen = set()
        unique_transactions = []
        
        for trans in transactions:
            # Create a key from date, amount, and first 50 chars of description
            key = (
                trans.get('date'),
                trans.get('amount'),
                trans.get('description', '')[:50]
            )
            
            if key not in seen:
                seen.add(key)
                unique_transactions.append(trans)
        
        return unique_transactions
