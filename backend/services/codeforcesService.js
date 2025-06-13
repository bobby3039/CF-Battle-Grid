const axios = require('axios');
require('dotenv').config();

const CF_API_BASE = process.env.CF_API_BASE || 'https://codeforces.com/api';

// Cache submissions for 1 minute to avoid hitting CF API too frequently
const submissionsCache = new Map();
const CACHE_DURATION = 60 * 1000; // 1 minute

async function getAllProblems() {
  try {
    const response = await axios.get(`${CF_API_BASE}/problemset.problems`);
    if (response.data.status === 'OK' && response.data.result && response.data.result.problems) {
      return response.data.result.problems;
    }
    throw new Error('Failed to fetch problems from Codeforces');
  } catch (error) {
    console.error('Error fetching all problems:', error);
    throw new Error('Failed to fetch problems from Codeforces: ' + (error.response?.data?.comment || error.message));
  }
}

async function getProblemsByTag(tags) {
  try {
    const response = await axios.get(`${CF_API_BASE}/problemset.problems`, {
      params: { tags }
    });
    
    if (response.data.status === 'OK' && response.data.result && response.data.result.problems) {
      return response.data.result.problems;
    }
    
    // If no problems found for the tag, return empty array instead of throwing
    if (response.data.status === 'OK') {
      console.log(`No problems found for tags: ${tags}`);
      return [];
    }
    
    throw new Error('Failed to fetch problems by tag from Codeforces');
  } catch (error) {
    console.error(`Error fetching problems for tags ${tags}:`, error);
    // Return empty array for tag-specific errors to allow the process to continue
    if (error.response?.status === 400) {
      console.log(`Invalid tag or no problems found for: ${tags}`);
      return [];
    }
    throw new Error('Failed to fetch problems from Codeforces: ' + (error.response?.data?.comment || error.message));
  }
}

async function getSolvedProblems(handle) {
  try {
    const response = await axios.get(`${CF_API_BASE}/user.status`, {
      params: { handle }
    });
    
    if (response.data.status === 'OK' && Array.isArray(response.data.result)) {
      // Filter for only accepted solutions
      const solved = response.data.result
        .filter(submission => submission.verdict === 'OK' && submission.problem)
        .map(submission => `${submission.problem.contestId}-${submission.problem.index}`);
      return [...new Set(solved)]; // Remove duplicates
    }
    
    if (response.data.status === 'OK') {
      return []; // Return empty array if no submissions found
    }
    
    throw new Error(`Failed to fetch solved problems for user ${handle}`);
  } catch (error) {
    console.error(`Error fetching solved problems for ${handle}:`, error);
    // If user not found or invalid handle, return empty array
    if (error.response?.status === 400) {
      console.log(`Invalid handle or user not found: ${handle}`);
      return [];
    }
    throw new Error(`Failed to fetch solved problems: ${error.response?.data?.comment || error.message}`);
  }
}

// Add rate limiting to avoid hitting Codeforces API limits
function rateLimit(fn, delay = 2000) {
  let lastCall = 0;
  return async function (...args) {
    const now = Date.now();
    if (now - lastCall < delay) {
      await new Promise(resolve => setTimeout(resolve, delay - (now - lastCall)));
    }
    lastCall = Date.now();
    return fn.apply(this, args);
  };
}

// Apply rate limiting to API calls
const rateLimitedGetProblemsByTag = rateLimit(getProblemsByTag);
const rateLimitedGetSolvedProblems = rateLimit(getSolvedProblems);

async function getUserSubmissions(handle) {
    // Check cache first
    const cacheKey = `submissions_${handle}`;
    const cachedData = submissionsCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
        return cachedData.submissions;
    }

    try {
        const response = await axios.get(`${CF_API_BASE}/user.status`, {
            params: {
                handle: handle,
                from: 1,
                count: 100 // Get last 100 submissions
            }
        });

        if (response.data.status === 'OK') {
            const submissions = response.data.result;
            // Cache the result
            submissionsCache.set(cacheKey, {
                submissions,
                timestamp: Date.now()
            });
            return submissions;
        }
        throw new Error('Failed to fetch submissions');
    } catch (error) {
        console.error('Error fetching CF submissions:', error);
        throw error;
    }
}

// Check if user has solved any of the problems in the board
async function checkSolvedProblems(handle, board) {
    try {
        const submissions = await getUserSubmissions(handle);
        const solvedProblems = new Set();

        // Filter for AC submissions
  submissions.forEach(sub => {
    if (sub.verdict === 'OK') {
                solvedProblems.add(`${sub.problem.contestId}${sub.problem.index}`);
    }
  });

        // Check each problem in the board
        const newlySolved = [];
        board.forEach((row, i) => {
            row.forEach((problem, j) => {
                const problemId = `${problem.contestId}${problem.index}`;
                if (solvedProblems.has(problemId)) {
                    newlySolved.push({ row: i, col: j, problem });
                }
            });
        });

        return newlySolved;
    } catch (error) {
        console.error('Error checking solved problems:', error);
        throw error;
    }
}

module.exports = {
  getAllProblems,
  getProblemsByTag: rateLimitedGetProblemsByTag,
  getSolvedProblems: rateLimitedGetSolvedProblems,
  getUserSubmissions,
  checkSolvedProblems
};
