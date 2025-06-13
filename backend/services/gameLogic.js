const { getAllProblems, getSolvedProblems, getProblemsByTag } = require('./codeforcesService');

async function getProblemsForTags(tags = [], tagMode = 'OR') {
  // Handle empty or undefined tags
  if (!tags || tags.length === 0 || tagMode === 'MIXED') {
    return await getAllProblems();
  }

  if (tagMode === 'AND') {
    // For AND mode, we can use a single API call with all tags
    return await getProblemsByTag(tags.join(';'));
  }

  // For OR mode, we need to fetch problems for each tag separately and combine them
  const allProblems = new Map(); // Use Map to maintain uniqueness by problem key

  try {
    // Fetch problems for each tag in parallel
    const problemsByTag = await Promise.all(
      tags.map(tag => getProblemsByTag(tag))
    );

    // Combine all problems, using Map to automatically handle duplicates
    problemsByTag.flat().forEach(problem => {
      if (problem && problem.contestId && problem.index) {
        const key = `${problem.contestId}-${problem.index}`;
        allProblems.set(key, problem);
      }
    });

    return Array.from(allProblems.values());
  } catch (error) {
    console.error('Error fetching problems by tags:', error);
    throw new Error('Failed to fetch problems. Please try again with different tags.');
  }
}

function filterByRating(problems, minDiff, maxDiff) {
  if (!Array.isArray(problems)) {
    console.error('Expected array of problems, got:', typeof problems);
    return [];
  }

  if (typeof minDiff !== 'number' || typeof maxDiff !== 'number') {
    throw new Error('Rating range must be specified with valid numbers');
  }

  return problems.filter(p => p.rating && p.rating >= minDiff && p.rating <= maxDiff);
}

function getUnsolvedProblems(problems, allSolvedSet) {
  if (!Array.isArray(problems)) {
    console.error('Expected array of problems, got:', typeof problems);
    return [];
  }
  return problems.filter(p => {
    if (!p || !p.contestId || !p.index) return false;
    const key = `${p.contestId}-${p.index}`;
    return !allSolvedSet.has(key);
  });
}

function selectRandomProblems(problems, count = 9) {
  if (!Array.isArray(problems)) {
    console.error('Expected array of problems, got:', typeof problems);
    return [];
  }
  const shuffled = [...problems].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function createGameBoard(teamA, teamB, settings) {
  console.log('Creating game board with settings:', JSON.stringify(settings, null, 2));
  console.log('Team A:', teamA);
  console.log('Team B:', teamB);

  if (!settings) {
    throw new Error('Game settings are required');
  }

  const { tags = [], tagMode = 'OR', minDifficulty, maxDifficulty } = settings;
  console.log('Extracted settings:', { tags, tagMode, minDifficulty, maxDifficulty });

  if (minDifficulty === undefined || maxDifficulty === undefined) {
    throw new Error('Both minimum and maximum difficulty must be specified');
  }

  const allHandles = [...teamA, ...teamB];
  console.log('All handles:', allHandles);

  try {
    // Step 1: Get problems based on tag mode
    console.log('Fetching problems with settings:', { tags, tagMode, minDifficulty, maxDifficulty });
    const problems = await getProblemsForTags(tags, tagMode);
    console.log(`Found ${problems.length} problems before filtering:`, problems.slice(0, 3));
    
    // Step 2: Filter by rating
    const ratingFiltered = filterByRating(problems, minDifficulty, maxDifficulty);
    console.log(`Found ${ratingFiltered.length} problems after rating filter:`, ratingFiltered.slice(0, 3));

    // Step 3: Collect all solved problems
  const allSolved = new Set();
    const solvedPromises = allHandles.map(handle => getSolvedProblems(handle));
    console.log('Fetching solved problems for handles:', allHandles);
    const solvedResults = await Promise.all(solvedPromises);
    solvedResults.forEach((solved, index) => {
      console.log(`${allHandles[index]} has solved ${solved.length} problems`);
      solved.forEach(p => allSolved.add(p));
    });
    console.log(`Total solved problems across all users: ${allSolved.size}`);

    // Step 4: Get unsolved problems for everyone
    const unsolved = getUnsolvedProblems(ratingFiltered, allSolved);
    console.log(`Found ${unsolved.length} unsolved problems matching criteria:`, unsolved.slice(0, 3));

    // Step 5: Pick 9 problems randomly
    if (unsolved.length < 9) {
      const errorMsg = `Not enough unsolved problems matching the criteria. Found ${unsolved.length} problems. Try adjusting the rating range or selecting different tags.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

  const selected = selectRandomProblems(unsolved, 9);
    console.log('Selected 9 problems:', selected);
  return [selected.slice(0, 3), selected.slice(3, 6), selected.slice(6, 9)];
  } catch (error) {
    console.error('Error in createGameBoard:', error);
    throw error;
  }
}

module.exports = {
  createGameBoard
};
