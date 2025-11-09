"""
Database operations for categorization rules.
This module provides functions to store and retrieve categorization rules
from the backend database via API calls.
"""
import os
from typing import List, Dict, Optional
import requests
from datetime import datetime


class CategorizationRuleDB:
    """
    Interface for storing categorization rules in the backend database.
    Uses the backend API to persist learned rules.
    """
    
    def __init__(self, backend_url: str = None):
        """
        Initialize the database interface.
        
        Args:
            backend_url: URL of the backend API (defaults to env variable)
        """
        self.backend_url = backend_url or os.getenv(
            "BACKEND_URL", 
            "http://localhost:3000"
        )
    
    def save_rule(
        self, 
        pattern: str, 
        category_id: str, 
        confidence: float,
        learned_from: int = 1
    ) -> Optional[Dict]:
        """
        Save a categorization rule to the database.
        
        Args:
            pattern: The pattern to match against transaction descriptions
            category_id: The category ID to assign
            confidence: Confidence score for this rule
            learned_from: Number of times this rule has been learned
            
        Returns:
            Created rule data or None if failed
        """
        try:
            response = requests.post(
                f"{self.backend_url}/api/categorization-rules",
                json={
                    "pattern": pattern,
                    "categoryId": category_id,
                    "confidence": confidence,
                    "learnedFrom": learned_from
                },
                timeout=5
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            else:
                print(f"Failed to save rule: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error saving rule to database: {e}")
            return None
    
    def get_rules(self) -> List[Dict]:
        """
        Retrieve all categorization rules from the database.
        
        Returns:
            List of rule dictionaries
        """
        try:
            response = requests.get(
                f"{self.backend_url}/api/categorization-rules",
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to get rules: {response.status_code}")
                return []
        except Exception as e:
            print(f"Error getting rules from database: {e}")
            return []
    
    def update_rule(
        self, 
        rule_id: str, 
        learned_from: int,
        confidence: float
    ) -> Optional[Dict]:
        """
        Update an existing categorization rule.
        
        Args:
            rule_id: ID of the rule to update
            learned_from: Updated learned_from count
            confidence: Updated confidence score
            
        Returns:
            Updated rule data or None if failed
        """
        try:
            response = requests.put(
                f"{self.backend_url}/api/categorization-rules/{rule_id}",
                json={
                    "learnedFrom": learned_from,
                    "confidence": confidence
                },
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to update rule: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error updating rule in database: {e}")
            return None
    
    def delete_rule(self, rule_id: str) -> bool:
        """
        Delete a categorization rule.
        
        Args:
            rule_id: ID of the rule to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            response = requests.delete(
                f"{self.backend_url}/api/categorization-rules/{rule_id}",
                timeout=5
            )
            
            return response.status_code in [200, 204]
        except Exception as e:
            print(f"Error deleting rule from database: {e}")
            return False
