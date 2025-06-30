import React, { useState } from 'react';
import api from '../api';
import '../styles/Leaderboard.css';

function Leaderboard() {
    const [handle, setHandle] = useState('');
    const [gameHistory, setGameHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchHistory = async () => {
        if (!handle.trim()) {
            setError('Please enter your Codeforces handle');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Fixed: Added /api prefix to match backend routing
            const response = await api.get(`/leaderboard/history/${handle.trim()}`);
            console.log('API Response:', response.data); // Debug log
            
            if (response.data.success) {
                setGameHistory(response.data.gameHistory);
                setStats(response.data.stats);
            } else {
                setError('Failed to fetch game history');
            }
        } catch (error) {
            console.error('API Error:', error); // Debug log
            setError(error.response?.data?.error || 'Failed to fetch game history');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getResultClass = (result) => {
        return result.toLowerCase();
    };

    const getWinnerDisplay = (game) => {
        if (game.winner === 'draw') {
            return 'Draw';
        }
        // Show which team won (teamA or teamB)
        return game.winner === 'teamA' ? 'Team A' : 'Team B';
    };

    return (
        <div className="leaderboard-container">
            <h1>Game History</h1>
            
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Enter your Codeforces handle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && fetchHistory()}
                    className="handle-input"
                />
                <button 
                    onClick={fetchHistory}
                    disabled={isLoading}
                    className="search-button"
                >
                    {isLoading ? 'Loading...' : 'Search'}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {stats && (
                <div className="stats-container">
                    <h2>Statistics for {handle}</h2>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Total Games</span>
                            <span className="stat-value">{stats.totalGames}</span>
                        </div>
                        <div className="stat-item wins">
                            <span className="stat-label">Wins</span>
                            <span className="stat-value">{stats.wins}</span>
                        </div>
                        <div className="stat-item losses">
                            <span className="stat-label">Losses</span>
                            <span className="stat-value">{stats.losses}</span>
                        </div>
                        <div className="stat-item draws">
                            <span className="stat-label">Draws</span>
                            <span className="stat-value">{stats.draws}</span>
                        </div>
                        {stats.winRate && (
                            <div className="stat-item win-rate">
                                <span className="stat-label">Win Rate</span>
                                <span className="stat-value">{stats.winRate}%</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {gameHistory.length > 0 && (
                <div className="history-container">
                    <h2>Game History</h2>
                    <div className="table-container">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Your Team</th>
                                    <th>Opponent Team</th>
                                    <th>Your Score</th>
                                    <th>Opponent Score</th>
                                    <th>Result</th>
                                    <th>Winner</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gameHistory.map((game, index) => (
                                    <tr key={game.gameId || index} className={getResultClass(game.result)}>
                                        <td>{formatDate(game.date)}</td>
                                        <td>
                                            <div className="team-info">
                                                <span className="team-name">
                                                    {game.userTeam.players.join(', ')}
                                                </span>
                                                <span className="team-label">({game.userTeam.name})</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="team-info">
                                                <span className="team-name">
                                                    {game.opponentTeam.players.join(', ')}
                                                </span>
                                                <span className="team-label">({game.opponentTeam.name})</span>
                                            </div>
                                        </td>
                                        <td className="score">{game.userTeam.solvedCount}</td>
                                        <td className="score">{game.opponentTeam.solvedCount}</td>
                                        <td className={`result ${getResultClass(game.result)}`}>
                                            <span className="result-badge">{game.result}</span>
                                        </td>
                                        <td className="winner">{getWinnerDisplay(game)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {gameHistory.length === 0 && !isLoading && handle && !error && (
                <div className="no-games">
                    No completed games found for handle "{handle}"
                </div>
            )}
        </div>
    );
}

export default Leaderboard;