"""
Tests for transaction categorization model.
"""
import pytest
import os
from models.categorizer import TransactionCategorizer


@pytest.fixture
def categorizer():
    """Create a fresh categorizer instance for testing."""
    test_rules_file = "test_categorization_rules.json"
    
    # Clean up any existing test file
    if os.path.exists(test_rules_file):
        os.remove(test_rules_file)
    
    cat = TransactionCategorizer(rules_file=test_rules_file)
    
    yield cat
    
    # Clean up after test
    if os.path.exists(test_rules_file):
        os.remove(test_rules_file)


def test_categorize_food_transaction(categorizer):
    """Test categorization of food-related transactions."""
    category, confidence = categorizer.categorize("Starbucks Coffee")
    
    assert category == "Food & Dining"
    assert confidence > 0.5


def test_categorize_transportation_transaction(categorizer):
    """Test categorization of transportation-related transactions."""
    category, confidence = categorizer.categorize("Uber ride to airport")
    
    assert category == "Transportation"
    assert confidence > 0.5


def test_categorize_shopping_transaction(categorizer):
    """Test categorization of shopping-related transactions."""
    category, confidence = categorizer.categorize("Amazon purchase")
    
    assert category == "Shopping"
    assert confidence > 0.5


def test_categorize_unknown_transaction(categorizer):
    """Test categorization of unknown transactions."""
    category, confidence = categorizer.categorize("XYZ123 Unknown Merchant")
    
    assert category == "Uncategorized"
    assert confidence < 0.5


def test_learn_new_pattern(categorizer):
    """Test learning a new categorization pattern."""
    # Initially should be uncategorized (using a unique merchant name)
    category, confidence = categorizer.categorize("ACME Corp XYZ123")
    assert category == "Uncategorized"
    
    # Learn the pattern
    success = categorizer.learn("ACME Corp XYZ123", "Bills & Fees")
    assert success is True
    
    # Should now categorize correctly
    category, confidence = categorizer.categorize("ACME Corp XYZ123")
    assert category == "Bills & Fees"
    assert confidence > 0.7


def test_learn_increases_confidence(categorizer):
    """Test that learning the same pattern multiple times increases confidence."""
    # Learn once
    categorizer.learn("Monthly Gym Membership", "Personal Care")
    category1, confidence1 = categorizer.categorize("Monthly Gym Membership")
    
    # Learn again
    categorizer.learn("Monthly Gym Membership", "Personal Care")
    category2, confidence2 = categorizer.categorize("Monthly Gym Membership")
    
    assert category1 == category2 == "Personal Care"
    assert confidence2 > confidence1


def test_learn_overwrites_incorrect_category(categorizer):
    """Test that learning with a different category overwrites the old one."""
    # Learn with wrong category
    categorizer.learn("Netflix Subscription", "Shopping")
    category1, _ = categorizer.categorize("Netflix Subscription")
    assert category1 == "Shopping"
    
    # Correct the category
    categorizer.learn("Netflix Subscription", "Entertainment")
    category2, _ = categorizer.categorize("Netflix Subscription")
    assert category2 == "Entertainment"


def test_learned_rules_persist(categorizer):
    """Test that learned rules are saved and can be loaded."""
    # Learn a pattern
    categorizer.learn("Custom Merchant ABC", "Healthcare")
    
    # Create a new categorizer with the same rules file
    new_categorizer = TransactionCategorizer(rules_file=categorizer.rules_file)
    
    # Should still know the pattern
    category, confidence = new_categorizer.categorize("Custom Merchant ABC")
    assert category == "Healthcare"
    assert confidence > 0.7


def test_categorize_with_amount(categorizer):
    """Test that categorization works with amount parameter."""
    # Amount is optional and doesn't affect current implementation
    category, confidence = categorizer.categorize("Grocery Store", amount=50.00)
    
    assert category == "Food & Dining"
    assert confidence > 0.5


def test_get_learned_rules_count(categorizer):
    """Test getting the count of learned rules."""
    assert categorizer.get_learned_rules_count() == 0
    
    categorizer.learn("Unique Merchant Alpha", "Shopping")
    assert categorizer.get_learned_rules_count() == 1
    
    categorizer.learn("Different Merchant Beta", "Food & Dining")
    assert categorizer.get_learned_rules_count() == 2


def test_clear_learned_rules(categorizer):
    """Test clearing all learned rules."""
    categorizer.learn("Unique Merchant Alpha", "Shopping")
    categorizer.learn("Different Merchant Beta", "Food & Dining")
    
    assert categorizer.get_learned_rules_count() == 2
    
    categorizer.clear_learned_rules()
    
    assert categorizer.get_learned_rules_count() == 0


def test_pattern_matching_case_insensitive(categorizer):
    """Test that pattern matching is case-insensitive."""
    # Test with different cases
    category1, confidence1 = categorizer.categorize("STARBUCKS COFFEE")
    category2, confidence2 = categorizer.categorize("starbucks coffee")
    category3, confidence3 = categorizer.categorize("Starbucks Coffee")
    
    assert category1 == category2 == category3 == "Food & Dining"
    assert confidence1 == confidence2 == confidence3


def test_pattern_matching_partial_match(categorizer):
    """Test that pattern matching works with partial keyword matches."""
    # "grocery" keyword should match in longer descriptions
    category, confidence = categorizer.categorize("Purchase at grocery store on Main St")
    
    assert category == "Food & Dining"
    assert confidence > 0.5


def test_pattern_matching_multiple_keywords(categorizer):
    """Test behavior when multiple keywords from different categories match."""
    # "amazon" (Shopping) and "food" (Food & Dining) both present
    category, confidence = categorizer.categorize("Amazon Fresh food delivery")
    
    # Should match one of the categories (implementation picks highest confidence)
    assert category in ["Shopping", "Food & Dining"]
    assert confidence > 0.5


def test_pattern_matching_longest_keyword_priority(categorizer):
    """Test that longer, more specific keywords get higher confidence."""
    # "whole foods" is longer than "food"
    category1, confidence1 = categorizer.categorize("Whole Foods Market")
    category2, confidence2 = categorizer.categorize("Food Mart")
    
    assert category1 == category2 == "Food & Dining"
    # Longer keyword should have higher confidence
    assert confidence1 > confidence2


def test_confidence_score_default_patterns(categorizer):
    """Test confidence scores for default pattern matches."""
    # Test that confidence is in expected range for default patterns (0.6-0.75)
    category, confidence = categorizer.categorize("Starbucks")
    
    assert category == "Food & Dining"
    assert 0.6 <= confidence <= 0.75


def test_confidence_score_learned_rules_base(categorizer):
    """Test confidence score for newly learned rules."""
    # Learn a new pattern once
    categorizer.learn("Unique Merchant XYZ", "Shopping")
    
    category, confidence = categorizer.categorize("Unique Merchant XYZ")
    
    assert category == "Shopping"
    # Base confidence for learned rules should be 0.8
    assert confidence >= 0.8


def test_confidence_score_learned_rules_increases(categorizer):
    """Test that confidence increases with repeated learning."""
    merchant = "Repeated Merchant ABC"
    
    # Learn once
    categorizer.learn(merchant, "Transportation")
    _, confidence1 = categorizer.categorize(merchant)
    
    # Learn twice more
    categorizer.learn(merchant, "Transportation")
    _, confidence2 = categorizer.categorize(merchant)
    
    categorizer.learn(merchant, "Transportation")
    _, confidence3 = categorizer.categorize(merchant)
    
    # Confidence should increase each time
    assert confidence2 > confidence1
    assert confidence3 > confidence2
    # But should cap at 0.95
    assert confidence3 <= 0.95


def test_confidence_score_learned_rules_max_cap(categorizer):
    """Test that confidence score caps at 0.95 for learned rules."""
    merchant = "Frequent Merchant"
    
    # Learn many times to exceed the cap
    for _ in range(10):
        categorizer.learn(merchant, "Bills & Fees")
    
    category, confidence = categorizer.categorize(merchant)
    
    assert category == "Bills & Fees"
    assert confidence <= 0.95


def test_confidence_score_uncategorized(categorizer):
    """Test confidence score for uncategorized transactions."""
    category, confidence = categorizer.categorize("ZZZZ Unknown Merchant 12345")
    
    assert category == "Uncategorized"
    assert confidence == 0.3


def test_confidence_score_learned_overrides_default(categorizer):
    """Test that learned rules have higher confidence than default patterns."""
    # "coffee" matches default pattern for Food & Dining
    _, default_confidence = categorizer.categorize("Coffee Shop ABC")
    
    # Learn a different category for this specific merchant
    categorizer.learn("Coffee Shop ABC", "Entertainment")
    _, learned_confidence = categorizer.categorize("Coffee Shop ABC")
    
    # Learned rule should have higher confidence
    assert learned_confidence > default_confidence


def test_pattern_extraction_removes_common_words(categorizer):
    """Test that pattern extraction removes common words."""
    # Learn with description containing common words
    categorizer.learn("Purchase at the Unique Store", "Shopping")
    
    # Should still match even with different common words
    category, confidence = categorizer.categorize("Payment to Unique Store")
    
    assert category == "Shopping"
    assert confidence > 0.7


def test_pattern_matching_learned_rules_priority(categorizer):
    """Test that learned rules take priority over default patterns."""
    # "gym" is in default patterns for Personal Care
    category1, _ = categorizer.categorize("ABC Gym")
    assert category1 == "Personal Care"
    
    # Learn a different category for this specific gym
    categorizer.learn("ABC Gym", "Entertainment")
    
    # Should now use learned category
    category2, confidence2 = categorizer.categorize("ABC Gym")
    assert category2 == "Entertainment"
    assert confidence2 > 0.8
