"""
Transaction categorization model using pattern matching.
"""
import re
from typing import Dict, List, Tuple, Optional
import json
import os


class TransactionCategorizer:
    """
    Simple pattern-based categorization model for transactions.
    Uses keyword matching and learned rules to suggest categories.
    """
    
    def __init__(self, rules_file: str = "categorization_rules.json"):
        """
        Initialize the categorizer with default patterns and load learned rules.
        
        Args:
            rules_file: Path to JSON file storing learned categorization rules
        """
        self.rules_file = rules_file
        
        # Default keyword patterns for common categories
        self.default_patterns: Dict[str, List[str]] = {
            "Food & Dining": [
                "grocery", "restaurant", "food", "cafe", "coffee", "lunch", "dinner",
                "breakfast", "pizza", "burger", "starbucks", "mcdonald", "subway",
                "chipotle", "domino", "taco", "sushi", "deli", "bakery", "market",
                "whole foods", "trader joe", "safeway", "kroger", "publix"
            ],
            "Transportation": [
                "gas", "fuel", "uber", "lyft", "taxi", "parking", "transit",
                "metro", "bus", "train", "subway", "toll", "car wash", "auto",
                "shell", "chevron", "exxon", "bp", "mobil"
            ],
            "Shopping": [
                "amazon", "walmart", "target", "store", "shop", "mall", "retail",
                "ebay", "etsy", "best buy", "costco", "ikea", "home depot", "lowes"
            ],
            "Utilities": [
                "electric", "water", "gas", "internet", "phone", "utility",
                "comcast", "verizon", "at&t", "spectrum", "xfinity", "power",
                "energy", "cable", "wireless"
            ],
            "Entertainment": [
                "movie", "netflix", "spotify", "hulu", "disney", "game", "concert",
                "theater", "cinema", "music", "streaming", "youtube", "apple music",
                "xbox", "playstation", "steam"
            ],
            "Healthcare": [
                "doctor", "pharmacy", "hospital", "medical", "health", "clinic",
                "cvs", "walgreens", "rite aid", "dental", "dentist", "vision",
                "prescription", "medicine", "urgent care"
            ],
            "Housing": [
                "rent", "mortgage", "insurance", "hoa", "property", "lease",
                "apartment", "condo", "home insurance", "renters insurance"
            ],
            "Personal Care": [
                "salon", "haircut", "spa", "gym", "fitness", "yoga", "massage",
                "beauty", "cosmetic", "barber", "nail", "planet fitness", "la fitness"
            ],
            "Bills & Fees": [
                "bill", "fee", "charge", "payment", "subscription", "membership",
                "annual fee", "service charge", "late fee"
            ],
            "Income": [
                "salary", "paycheck", "wage", "income", "deposit", "payment received",
                "refund", "reimbursement", "bonus", "commission"
            ]
        }
        
        # Learned rules from user corrections
        self.learned_rules: List[Dict] = []
        self._load_learned_rules()
    
    def _load_learned_rules(self) -> None:
        """Load learned categorization rules from file."""
        if os.path.exists(self.rules_file):
            try:
                with open(self.rules_file, 'r') as f:
                    self.learned_rules = json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading learned rules: {e}")
                self.learned_rules = []
    
    def _save_learned_rules(self) -> None:
        """Save learned categorization rules to file."""
        try:
            with open(self.rules_file, 'w') as f:
                json.dump(self.learned_rules, f, indent=2)
        except IOError as e:
            print(f"Error saving learned rules: {e}")
    
    def categorize(self, description: str, amount: Optional[float] = None) -> Tuple[str, float]:
        """
        Suggest a category for a transaction based on its description.
        
        Args:
            description: Transaction description text
            amount: Optional transaction amount (can be used for additional context)
            
        Returns:
            Tuple of (category_name, confidence_score)
        """
        description_lower = description.lower()
        
        # First, check learned rules (higher priority)
        learned_match = self._check_learned_rules(description_lower)
        if learned_match:
            return learned_match
        
        # Then check default patterns
        default_match = self._check_default_patterns(description_lower)
        if default_match:
            return default_match
        
        # No match found - return uncategorized with low confidence
        return ("Uncategorized", 0.3)
    
    def _check_learned_rules(self, description_lower: str) -> Optional[Tuple[str, float]]:
        """
        Check if description matches any learned rules.
        
        Args:
            description_lower: Lowercase transaction description
            
        Returns:
            Tuple of (category, confidence) if match found, None otherwise
        """
        best_match = None
        best_confidence = 0.0
        
        for rule in self.learned_rules:
            pattern = rule.get("pattern", "").lower()
            category = rule.get("category")
            learned_from = rule.get("learned_from", 1)
            
            if not pattern or not category:
                continue
            
            # Check if pattern matches (exact substring match)
            if pattern in description_lower:
                # Confidence increases with number of times learned
                # Base confidence of 0.8, increases up to 0.95
                confidence = min(0.8 + (learned_from * 0.03), 0.95)
                
                if confidence > best_confidence:
                    best_match = (category, confidence)
                    best_confidence = confidence
        
        return best_match
    
    def _check_default_patterns(self, description_lower: str) -> Optional[Tuple[str, float]]:
        """
        Check if description matches any default keyword patterns.
        
        Args:
            description_lower: Lowercase transaction description
            
        Returns:
            Tuple of (category, confidence) if match found, None otherwise
        """
        matches = []
        
        for category, keywords in self.default_patterns.items():
            for keyword in keywords:
                if keyword in description_lower:
                    # Calculate confidence based on keyword specificity
                    # Longer keywords get higher confidence
                    confidence = min(0.6 + (len(keyword) * 0.01), 0.75)
                    matches.append((category, confidence, len(keyword)))
        
        if not matches:
            return None
        
        # Return the match with highest confidence and longest keyword
        matches.sort(key=lambda x: (x[1], x[2]), reverse=True)
        return (matches[0][0], matches[0][1])
    
    def learn(self, description: str, category: str, amount: Optional[float] = None) -> bool:
        """
        Learn from user correction to improve future categorization.
        
        Args:
            description: Transaction description
            category: Correct category provided by user
            amount: Optional transaction amount
            
        Returns:
            True if learning was successful
        """
        description_lower = description.lower()
        
        # Extract the most distinctive part of the description as pattern
        # For now, use the whole description, but could be enhanced to extract merchant name
        pattern = self._extract_pattern(description_lower)
        
        # Check if we already have a rule for this pattern
        existing_rule = None
        for rule in self.learned_rules:
            if rule.get("pattern") == pattern:
                existing_rule = rule
                break
        
        if existing_rule:
            # Update existing rule
            if existing_rule.get("category") == category:
                # Same category - increase learned_from count
                existing_rule["learned_from"] = existing_rule.get("learned_from", 1) + 1
            else:
                # Different category - replace with new category and reset count
                existing_rule["category"] = category
                existing_rule["learned_from"] = 1
        else:
            # Create new rule
            new_rule = {
                "pattern": pattern,
                "category": category,
                "learned_from": 1
            }
            self.learned_rules.append(new_rule)
        
        # Save updated rules
        self._save_learned_rules()
        return True
    
    def _extract_pattern(self, description_lower: str) -> str:
        """
        Extract a pattern from the transaction description.
        Uses the first 2-3 significant words to create a more specific pattern.
        
        Args:
            description_lower: Lowercase transaction description
            
        Returns:
            Extracted pattern string
        """
        # Remove common prefixes and suffixes
        cleaned = re.sub(r'\b(purchase|payment|at|from|to|the|a|an)\b', '', description_lower)
        cleaned = cleaned.strip()
        
        # Extract first 2-3 meaningful words (at least 3 characters each)
        words = []
        for word in cleaned.split():
            if len(word) >= 3 and (word.isalpha() or word.isalnum()):
                words.append(word)
                if len(words) >= 2:
                    break
        
        if words:
            return ' '.join(words)
        
        # If no good words found, use first 30 characters of original
        return description_lower[:30].strip()
    
    def get_learned_rules_count(self) -> int:
        """Get the number of learned rules."""
        return len(self.learned_rules)
    
    def clear_learned_rules(self) -> None:
        """Clear all learned rules (for testing purposes)."""
        self.learned_rules = []
        self._save_learned_rules()


# Global categorizer instance
_categorizer_instance: Optional[TransactionCategorizer] = None


def get_categorizer() -> TransactionCategorizer:
    """
    Get or create the global categorizer instance.
    
    Returns:
        TransactionCategorizer instance
    """
    global _categorizer_instance
    if _categorizer_instance is None:
        _categorizer_instance = TransactionCategorizer()
    return _categorizer_instance
