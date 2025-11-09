"""
Test script to verify Polish amount parsing.
"""
from pdf_parser import PDFParser

def test_polish_amounts():
    """Test parsing of Polish currency amounts."""
    parser = PDFParser()
    
    test_cases = [
        # (input, expected_output)
        ("149,06 zł", 149.06),
        ("149,06zł", 149.06),
        ("149,06 PLN", 149.06),
        ("-149,06 zł", -149.06),
        ("1 234,56 zł", 1234.56),
        ("1.234,56 zł", 1234.56),
        ("10,00 zł", 10.00),
        ("1 000,00 zł", 1000.00),
        # English format
        ("149.06", 149.06),
        ("1,234.56", 1234.56),
        ("$149.06", 149.06),
    ]
    
    print("Testing Polish amount parsing:\n")
    
    for input_str, expected in test_cases:
        result = parser._parse_amount(input_str)
        status = "✓" if result == expected else "✗"
        print(f"{status} Input: '{input_str:20s}' -> Expected: {expected:10.2f}, Got: {result if result else 'None':10}")
    
    print("\nTest complete!")

if __name__ == "__main__":
    test_polish_amounts()
