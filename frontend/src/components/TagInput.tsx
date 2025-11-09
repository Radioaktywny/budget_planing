import React, { useState, useEffect, useRef } from 'react';
import { tagService } from '../services/tagService';
import { Tag } from '../types';

interface TagInputProps {
  value: string[]; // Array of tag IDs
  onChange: (tagIds: string[]) => void;
  label?: string;
  className?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  label = 'Tags',
  className = '',
}) => {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    // Handle click outside to close suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await tagService.getAll();
      setAllTags(data);
    } catch (err: any) {
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    if (val.trim()) {
      // Filter tags that match input and aren't already selected
      const filtered = allTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(val.toLowerCase()) &&
          !value.includes(tag.id)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectTag = (tagId: string) => {
    if (!value.includes(tagId)) {
      onChange([...value, tagId]);
    }
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleCreateTag = async () => {
    const tagName = inputValue.trim();
    if (!tagName) return;

    // Check if tag already exists
    const existingTag = allTags.find(
      (tag) => tag.name.toLowerCase() === tagName.toLowerCase()
    );

    if (existingTag) {
      handleSelectTag(existingTag.id);
      return;
    }

    try {
      const newTag = await tagService.create({ name: tagName });
      setAllTags([...allTags, newTag]);
      onChange([...value, newTag.id]);
      setInputValue('');
      setSuggestions([]);
      setShowSuggestions(false);
      inputRef.current?.focus();
    } catch (err: any) {
      console.error('Failed to create tag:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectTag(suggestions[0].id);
      } else if (inputValue.trim()) {
        handleCreateTag();
      }
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(value.filter((id) => id !== tagId));
  };

  const getSelectedTags = (): Tag[] => {
    return allTags.filter((tag) => value.includes(tag.id));
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-gray-700 text-sm font-bold mb-2">
          {label}
        </label>
      )}
      
      {/* Selected tags as chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        {getSelectedTags().map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim() && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder="Type to search or create tags..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && (suggestions.length > 0 || inputValue.trim()) && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {suggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleSelectTag(tag.id)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              >
                {tag.name}
                {tag.usageCount !== undefined && (
                  <span className="text-gray-500 text-sm ml-2">
                    ({tag.usageCount})
                  </span>
                )}
              </button>
            ))}
            {suggestions.length === 0 && inputValue.trim() && (
              <button
                type="button"
                onClick={handleCreateTag}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-blue-600"
              >
                Create "{inputValue}"
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 mt-1">
        Press Enter to add a tag
      </p>
    </div>
  );
};

export default TagInput;
