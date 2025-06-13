import React, { useState } from 'react';

const AVAILABLE_TAGS = [
  '2-sat', 'binary search', 'bitmasks', 'brute force', 'chinese remainder theorem',
  'combinatorics', 'constructive algorithms', 'data structures', 'dfs and similar',
  'divide and conquer', 'dp', 'dsu', 'expression parsing', 'fft', 'flows', 'games',
  'geometry', 'graph matchings', 'graphs', 'greedy', 'hashing', 'implementation',
  'interactive', 'math', 'matrices', 'meet-in-the-middle', 'number theory',
  'probabilities', 'schedules', 'shortest paths', 'sortings', 'string suffix structures',
  'strings', 'ternary search', 'trees', 'two pointers'
];

const RATING_STEPS = Array.from({ length: 28 }, (_, i) => 800 + i * 100);

function GameSettingsModal({ onSave, onCancel }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [minRating, setMinRating] = useState(800);
  const [maxRating, setMaxRating] = useState(1800);
  const [tagMode, setTagMode] = useState('MIXED'); // 'AND', 'OR', or 'MIXED'

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = () => {
    if (tagMode !== 'MIXED' && selectedTags.length === 0) {
      alert('Please select at least one tag or choose Mixed mode');
      return;
    }
    if (minRating >= maxRating) {
      alert('Maximum rating must be greater than minimum rating');
      return;
    }

    // Ensure ratings are numbers
    const settings = {
      tags: selectedTags,
      tagMode: tagMode,
      minDifficulty: parseInt(minRating, 10),
      maxDifficulty: parseInt(maxRating, 10)
    };

    // Double check that we have valid numbers
    if (isNaN(settings.minDifficulty) || isNaN(settings.maxDifficulty)) {
      alert('Invalid rating values');
      return;
    }

    onSave(settings);
  };

  const handleRatingChange = (setter) => (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setter(value);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h2 style={styles.heading}>Game Settings</h2>
        
        <div style={styles.section}>
          <h3>Tag Selection Mode</h3>
          <div style={styles.tagModeContainer}>
          <label style={styles.modeLabel}>
              <input
                type="radio"
                value="MIXED"
                checked={tagMode === 'MIXED'}
                onChange={(e) => setTagMode(e.target.value)}
              />
              Mixed (no tag restrictions)
            </label>
            <label style={styles.modeLabel}>
              <input
                type="radio"
                value="AND"
                checked={tagMode === 'AND'}
                onChange={(e) => setTagMode(e.target.value)}
              />
              AND (problems must have all selected tags)
            </label>
            <label style={styles.modeLabel}>
              <input
                type="radio"
                value="OR"
                checked={tagMode === 'OR'}
                onChange={(e) => setTagMode(e.target.value)}
              />
              OR (problems must have at least one selected tag)
                  (Note :- Avoid selecting more than 3 tags.)
            </label>
           
          </div>
        </div>

        <div style={styles.section}>
          <h3>Problem Tags</h3>
          <div style={tagMode === 'MIXED' ? styles.tagsContainerDisabled : styles.tagsContainer}>
            {AVAILABLE_TAGS.map(tag => (
              <label key={tag} style={styles.tagLabel}>
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                  disabled={tagMode === 'MIXED'}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h3>Rating Range</h3>
          <div style={styles.ratingContainer}>
            <div style={styles.ratingSelect}>
              <label>Minimum Rating:</label>
              <select 
                value={minRating}
                onChange={handleRatingChange(setMinRating)}
              >
                {RATING_STEPS.map(rating => (
                  <option key={rating} value={rating}>{rating}</option>
                ))}
              </select>
            </div>
            <div style={styles.ratingSelect}>
              <label>Maximum Rating:</label>
              <select 
                value={maxRating}
                onChange={handleRatingChange(setMaxRating)}
              >
                {RATING_STEPS.map(rating => (
                  <option key={rating} value={rating}>{rating}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={styles.buttonContainer}>
          <button onClick={handleSave} style={styles.saveButton}>
            Save Settings
          </button>
          <button onClick={onCancel} style={styles.cancelButton}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  heading: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333'
  },
  section: {
    marginBottom: '20px'
  },
  tagModeContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  modeLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '5px'
  },
  tagsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  tagsContainerDisabled: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    opacity: 0.5,
    pointerEvents: 'none'
  },
  tagLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px',
    cursor: 'pointer'
  },
  ratingContainer: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center'
  },
  ratingSelect: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '20px'
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default GameSettingsModal; 