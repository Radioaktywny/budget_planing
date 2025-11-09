"""
PDF bank statement parser using Google Gemini AI.
Much more accurate than regex-based parsing, especially for Polish documents.
"""
import os
import json
from typing import List, Dict, Optional
import google.generativeai as genai
import PyPDF2
import pdfplumber


class GeminiPDFParser:
    """Parser for bank statement PDFs using Google Gemini AI."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini PDF parser.
        
        Args:
            api_key: Google Gemini API key (or set GEMINI_API_KEY env variable)
        """
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("Gemini API key not provided. Set GEMINI_API_KEY environment variable.")
        
        genai.configure(api_key=self.api_key)
        # Use gemini-2.5-flash - the stable, free, and fast model
        # This is the latest free tier model available
        self.model = genai.GenerativeModel('models/gemini-2.5-flash')
    
    def parse_pdf(self, file_path: str, user_categories: Optional[List[str]] = None, user_accounts: Optional[List[str]] = None) -> List[Dict]:
        """
        Parse PDF file and extract transactions using Gemini AI.
        
        Args:
            file_path: Path to PDF file
            user_categories: List of user's existing categories for better categorization
            user_accounts: List of user's existing accounts for account detection
            
        Returns:
            List of transaction dictionaries
        """
        print(f"🤖 Gemini AI: Parsing PDF with AI...")
        
        # Extract text from PDF
        text = self._extract_text_from_pdf(file_path)
        
        if not text or len(text.strip()) < 50:
            raise ValueError("Could not extract sufficient text from PDF")
        
        print(f"📄 Extracted {len(text)} characters from PDF")
        
        # Use Gemini to parse transactions
        transactions = self._parse_with_gemini(text, user_categories, user_accounts)
        
        print(f"✓ Gemini AI parsed {len(transactions)} transactions")
        
        return transactions
    
    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extract all text from PDF file."""
        text_parts = []
        
        # Try pdfplumber first (better for tables)
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
        except Exception as e:
            print(f"pdfplumber extraction failed: {e}")
        
        # Fallback to PyPDF2 if needed
        if not text_parts:
            try:
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text_parts.append(page_text)
            except Exception as e:
                print(f"PyPDF2 extraction failed: {e}")
        
        return '\n\n'.join(text_parts)
    
    def _parse_with_gemini(self, text: str, user_categories: Optional[List[str]] = None, user_accounts: Optional[List[str]] = None) -> List[Dict]:
        """
        Use Gemini AI to parse transactions from text.
        
        Args:
            text: Extracted PDF text
            user_categories: List of user's existing categories
            user_accounts: List of user's existing accounts
            
        Returns:
            List of transaction dictionaries
        """
        # Build the prompt
        prompt = self._build_prompt(text, user_categories, user_accounts)
        
        try:
            # Call Gemini API
            response = self.model.generate_content(prompt)
            
            # Parse JSON response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            # Log full Gemini response
            print(f"🔍 GEMINI FULL RESPONSE:")
            print(f"{'='*80}")
            print(response_text[:2000])  # First 2000 chars
            print(f"{'='*80}")
            
            # Parse JSON
            data = json.loads(response_text)
            
            # Extract account name if provided
            account_name = data.get('account')
            if account_name:
                print(f"🏦 Detected account: {account_name}")
            
            # Extract transactions
            transactions = data.get('transactions', [])
            
            # Debug: Check first transaction
            if transactions and len(transactions) > 0:
                first_trans = transactions[0]
                print(f"📝 Sample transaction: category='{first_trans.get('category')}', account='{first_trans.get('account')}')")
            
            # Validate and clean transactions
            validated_transactions = []
            for trans in transactions:
                if self._validate_transaction(trans):
                    # Add account name to each transaction if detected
                    if account_name:
                        trans['account'] = account_name
                    validated_transactions.append(trans)
            
            return validated_transactions
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse Gemini response as JSON: {e}")
            print(f"Response: {response_text[:500]}")
            return []
        except Exception as e:
            print(f"Gemini API error: {e}")
            return []
    
    def _build_prompt(self, text: str, user_categories: Optional[List[str]] = None, user_accounts: Optional[List[str]] = None) -> str:
        """Build the prompt for Gemini AI."""
        
        categories_text = ""
        if user_categories and len(user_categories) > 0:
            categories_text = f"""
Available categories (MUST use one of these - choose the most appropriate):
{', '.join(user_categories)}
"""
        
        accounts_text = ""
        if user_accounts and len(user_accounts) > 0:
            accounts_text = f"""
Available accounts (try to detect which account this statement belongs to):
{', '.join(user_accounts)}
"""
        
        prompt = f"""You are a bank statement parser. Extract all transactions from the following bank statement text.

IMPORTANT INSTRUCTIONS:
1. The document may be in Polish or English
2. For Polish amounts: comma (,) is the decimal separator, not thousands separator
   - Example: "149,06 zł" = 149.06 (NOT 14906.00)
   - Example: "1 234,56 zł" = 1234.56
3. For dates: Polish format is DD.MM.YYYY (e.g., 15.01.2024)
4. Transaction type should be "income" or "expense"
5. Amount should ALWAYS be a POSITIVE number (e.g., 46.46, not -46.46)
6. Negative amounts or withdrawals in the statement = "expense" type with positive amount
7. Positive amounts or deposits in the statement = "income" type with positive amount
8. If a transaction mentions "przelew" (transfer), "wpłata" (deposit), or "wypłata" (withdrawal), categorize accordingly
{categories_text}{accounts_text}

Return ONLY a JSON object with this exact structure (no additional text):
{{
  "account": "Account name from available accounts or null",
  "transactions": [
    {{
      "date": "YYYY-MM-DD",
      "amount": 149.06,
      "description": "Transaction description",
      "type": "expense",
      "category": "Category name from available categories or null"
    }}
  ]
}}

Bank statement text:
{text}

Remember: Return ONLY the JSON object, nothing else. Use ONLY categories from the provided list."""
        
        return prompt
    
    def _validate_transaction(self, trans: Dict) -> bool:
        """
        Validate and fix transaction data.
        
        Args:
            trans: Transaction dictionary
            
        Returns:
            True if valid
        """
        required_fields = ['date', 'amount', 'description', 'type']
        
        # Check required fields exist
        for field in required_fields:
            if field not in trans:
                return False
        
        # Validate and fix amount
        try:
            amount = float(trans['amount'])
            # Convert negative amounts to positive (amount should always be positive)
            trans['amount'] = abs(amount)
        except (ValueError, TypeError):
            return False
        
        # Validate type
        if trans['type'] not in ['income', 'expense', 'transfer']:
            return False
        
        # Validate date format (basic check)
        if not isinstance(trans['date'], str) or len(trans['date']) < 8:
            return False
        
        return True


# Fallback to regex parser if Gemini is not available
def create_pdf_parser(use_gemini: bool = True) -> object:
    """
    Create appropriate PDF parser based on configuration.
    
    Args:
        use_gemini: Whether to use Gemini AI parser
        
    Returns:
        PDF parser instance
    """
    api_key = os.getenv('GEMINI_API_KEY')
    
    if use_gemini and api_key:
        try:
            print("✓ Gemini API key found - Using Gemini AI parser for better accuracy!")
            return GeminiPDFParser(api_key)
        except Exception as e:
            print(f"✗ Failed to initialize Gemini parser: {e}")
            print("→ Falling back to regex parser")
    else:
        if not api_key:
            print("ℹ No Gemini API key found - Using regex parser")
            print("  To use Gemini AI, add GEMINI_API_KEY to ai-service/.env")
        else:
            print("ℹ Gemini disabled - Using regex parser")
    
    # Fallback to regex parser
    from parsers.pdf_parser import PDFParser
    return PDFParser()
