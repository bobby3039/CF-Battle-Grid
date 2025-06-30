const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// Get game history for a specific user
router.get('/history/:handle', async (req, res) => {
    try {
        const { handle } = req.params;
        console.log('=== DEBUG: Fetching history for handle:', handle);
        
        // First, let's debug - find ALL games to see what we have
        const allGames = await Room.find({});
        console.log('=== DEBUG: Total games in database:', allGames.length);
        
        // Check which games have the handle
        const gamesWithHandle = allGames.filter(game => 
            game.teamA.includes(handle) || game.teamB.includes(handle)
        );
        console.log('=== DEBUG: Games containing handle "' + handle + '":', gamesWithHandle.length);
        
        // Check completed games with handle
        const completedGamesWithHandle = gamesWithHandle.filter(game => game.winner !== null);
        console.log('=== DEBUG: Completed games with handle:', completedGamesWithHandle.length);
        
        if (completedGamesWithHandle.length > 0) {
            console.log('=== DEBUG: Sample completed game:', {
                roomId: completedGamesWithHandle[0].roomId,
                teamA: completedGamesWithHandle[0].teamA,
                teamB: completedGamesWithHandle[0].teamB,
                winner: completedGamesWithHandle[0].winner,
                solvedProblemsType: typeof completedGamesWithHandle[0].solvedProblems,
                solvedProblemsIsMap: completedGamesWithHandle[0].solvedProblems instanceof Map,
                solvedProblemsKeys: completedGamesWithHandle[0].solvedProblems instanceof Map 
                    ? Array.from(completedGamesWithHandle[0].solvedProblems.keys())
                    : Object.keys(completedGamesWithHandle[0].solvedProblems || {})
            });
        }
        
        // Find completed games where the user participated
        const games = await Room.find({
            $and: [
                { winner: { $ne: null } }, // Only completed games
                {
                    $or: [
                        { teamA: { $in: [handle] } }, // User is in teamA array
                        { teamB: { $in: [handle] } }  // User is in teamB array
                    ]
                }
            ]
        }).sort({ createdAt: -1 }); // Most recent first

        console.log('=== DEBUG: MongoDB query found games:', games.length);

        // Transform the games data
        const gameHistory = games.map(game => {
            console.log('=== DEBUG: Processing game:', game.roomId);
            console.log('=== DEBUG: Game teams - A:', game.teamA, 'B:', game.teamB);
            console.log('=== DEBUG: Handle check - in teamA:', game.teamA.includes(handle), 'in teamB:', game.teamB.includes(handle));
            
            const wasInTeamA = game.teamA.includes(handle);
            const userTeam = wasInTeamA ? 'teamA' : 'teamB';
            const opponentTeam = wasInTeamA ? 'teamB' : 'teamA';
            
            console.log('=== DEBUG: User team:', userTeam, 'Opponent team:', opponentTeam);
            
            // Count solved problems for each team
            const solvedCount = {
                teamA: 0,
                teamB: 0
            };

            console.log('=== DEBUG: solvedProblems type:', typeof game.solvedProblems);
            console.log('=== DEBUG: solvedProblems instanceof Map:', game.solvedProblems instanceof Map);

            // Process solvedProblems - MongoDB stores Maps as objects
            if (game.solvedProblems) {
                if (game.solvedProblems instanceof Map) {
                    // Handle as Map
                    console.log('=== DEBUG: Processing as Map, size:', game.solvedProblems.size);
                    game.solvedProblems.forEach((value, key) => {
                        console.log('=== DEBUG: Map entry:', key, '=', value);
                        if (value && value.team) {
                            solvedCount[value.team] = (solvedCount[value.team] || 0) + 1;
                            console.log('=== DEBUG: Incremented', value.team, 'to', solvedCount[value.team]);
                        }
                    });
                } else {
                    // Handle as plain object (which is what MongoDB usually returns)
                    console.log('=== DEBUG: Processing as Object');
                    console.log('=== DEBUG: Object keys:', Object.keys(game.solvedProblems));
                    
                    Object.entries(game.solvedProblems).forEach(([key, value]) => {
                        console.log('=== DEBUG: Object entry:', key, '=', value);
                        if (value && value.team) {
                            solvedCount[value.team] = (solvedCount[value.team] || 0) + 1;
                            console.log('=== DEBUG: Incremented', value.team, 'to', solvedCount[value.team]);
                        }
                    });
                }
            } else {
                console.log('=== DEBUG: No solvedProblems found');
            }

            console.log('=== DEBUG: Final solved count:', solvedCount);

            // Determine game result from user's perspective
            let result;
            if (game.winner === 'draw') {
                result = 'Draw';
            } else {
                result = game.winner === userTeam ? 'Win' : 'Loss';
            }

            console.log('=== DEBUG: Game result calculation:');
            console.log('  - Game winner:', game.winner);
            console.log('  - User team:', userTeam);
            console.log('  - Result:', result);

            return {
                gameId: game.roomId,
                date: game.createdAt,
                userTeam: {
                    name: userTeam,
                    players: wasInTeamA ? game.teamA : game.teamB,
                    solvedCount: solvedCount[userTeam] || 0
                },
                opponentTeam: {
                    name: opponentTeam,
                    players: wasInTeamA ? game.teamB : game.teamA,
                    solvedCount: solvedCount[opponentTeam] || 0
                },
                result,
                totalSolved: (solvedCount.teamA || 0) + (solvedCount.teamB || 0),
                winner: game.winner
            };
        });

        // Calculate statistics
        const stats = {
            totalGames: gameHistory.length,
            wins: gameHistory.filter(g => g.result === 'Win').length,
            losses: gameHistory.filter(g => g.result === 'Loss').length,
            draws: gameHistory.filter(g => g.result === 'Draw').length,
        };

        // Add win rate calculation
        stats.winRate = stats.totalGames > 0 ? 
            ((stats.wins / stats.totalGames) * 100).toFixed(1) : 0;

        console.log('=== DEBUG: Final results:');
        console.log('  - Stats:', stats);
        console.log('  - GameHistory length:', gameHistory.length);
        console.log('  - First game (if any):', gameHistory[0] || 'No games');

        res.json({
            success: true,
            gameHistory,
            stats
        });
    } catch (error) {
        console.error('Error fetching game history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch game history'
        });
    }
});

module.exports = router;