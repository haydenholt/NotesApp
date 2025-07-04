import { TimeFormatter } from '../utils/TimeFormatter.js';

export class StatisticsController {
    constructor(appState, themeManager) {
        this.appState = appState;
        this.themeManager = themeManager;
        
        this.listeners = {
            statisticsUpdated: [],
            projectStatsUpdated: []
        };
    }

    calculateDailyStatistics(notes) {
        let failedCount = 0;
        let nonFailedCount = 0;
        let noIssueCount = 0;

        notes.forEach(note => {
            const isCompleted = note.completed;
            const isCanceled = note.canceled;

            if (isCompleted && !isCanceled) {
                const hasFailing = note.elements.failingIssues.value.trim() !== '';
                const hasNonFailing = note.elements.nonFailingIssues.value.trim() !== '';

                if (hasFailing) {
                    failedCount++;
                } else if (hasNonFailing) {
                    nonFailedCount++;
                } else {
                    noIssueCount++;
                }
            }
        });

        const stats = {
            failedCount,
            nonFailedCount,
            noIssueCount,
            totalCompleted: failedCount + nonFailedCount + noIssueCount,
            date: this.appState.getCurrentDate()
        };

        this.notifyListeners('statisticsUpdated', stats);
        return stats;
    }

    calculateProjectFailRates(notes) {
        const projectStats = {};
        const currentDate = this.appState.getCurrentDate();

        notes.forEach(note => {
            const projectID = note.elements.projectID.value.trim();
            if (!projectID || note.canceled || !note.completed) return;

            if (!projectStats[projectID]) {
                projectStats[projectID] = {
                    total: 0,
                    failed: 0,
                    nonFailed: 0,
                    totalTime: 0
                };
            }

            projectStats[projectID].total++;
            projectStats[projectID].totalTime += note.timer.getSeconds();

            if (note.elements.failingIssues.value.trim() !== '') {
                projectStats[projectID].failed++;
            } else if (note.elements.nonFailingIssues.value.trim() !== '') {
                projectStats[projectID].nonFailed++;
            }
        });

        const enhancedStats = this.enhanceProjectStats(projectStats);
        
        this.notifyListeners('projectStatsUpdated', {
            stats: enhancedStats,
            date: currentDate
        });

        return enhancedStats;
    }

    enhanceProjectStats(projectStats) {
        const enhanced = {};

        for (const [projectID, stats] of Object.entries(projectStats)) {
            const failRate = stats.total > 0 ? (stats.failed / stats.total * 100) : 0;
            const nonFailRate = stats.total > 0 ? (stats.nonFailed / stats.total * 100) : 0;
            const avgTimeSeconds = stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0;
            const avgTime = TimeFormatter.formatTime(avgTimeSeconds);
            
            const displayID = projectID.length > 5 ? 
                projectID.substring(projectID.length - 5) : 
                projectID;

            enhanced[projectID] = {
                ...stats,
                failRate: parseFloat(failRate.toFixed(1)),
                nonFailRate: parseFloat(nonFailRate.toFixed(1)),
                avgTimeSeconds,
                avgTime,
                displayID
            };
        }

        return enhanced;
    }

    calculateSearchStatistics(searchResults) {
        let failedCount = 0;
        let nonFailedCount = 0;
        let noIssueCount = 0;

        searchResults.forEach(({ note }) => {
            if (note.completed && !note.canceled) {
                const hasFailing = note.failingIssues && note.failingIssues.trim() !== '';
                const hasNonFailing = note.nonFailingIssues && note.nonFailingIssues.trim() !== '';

                if (hasFailing) {
                    failedCount++;
                } else if (hasNonFailing) {
                    nonFailedCount++;
                } else {
                    noIssueCount++;
                }
            }
        });

        return {
            failedCount,
            nonFailedCount,
            noIssueCount,
            totalResults: searchResults.length,
            totalCompleted: failedCount + nonFailedCount + noIssueCount
        };
    }

    calculateSearchProjectFailRates(searchResults) {
        const projectStats = {};

        searchResults.forEach(({ note }) => {
            const projectID = note.projectID ? note.projectID.trim() : '';
            if (!projectID || note.canceled || !note.completed) return;

            if (!projectStats[projectID]) {
                projectStats[projectID] = {
                    total: 0,
                    failed: 0,
                    nonFailed: 0,
                    totalTime: 0
                };
            }

            projectStats[projectID].total++;

            if (note.startTimestamp && note.endTimestamp) {
                const startTime = new Date(note.startTimestamp).getTime();
                const endTime = new Date(note.endTimestamp).getTime();
                const seconds = Math.floor((endTime - startTime) / 1000);
                projectStats[projectID].totalTime += seconds;
            }

            if (note.additionalTime) {
                projectStats[projectID].totalTime += parseInt(note.additionalTime) || 0;
            }

            if (note.failingIssues && note.failingIssues.trim() !== '') {
                projectStats[projectID].failed++;
            } else if (note.nonFailingIssues && note.nonFailingIssues.trim() !== '') {
                projectStats[projectID].nonFailed++;
            }
        });

        return this.enhanceProjectStats(projectStats);
    }

    getStatsData(stats) {
        return [
            { 
                label: 'Fails', 
                count: stats.failedCount, 
                accent: 'error' 
            },
            { 
                label: 'Non-fails', 
                count: stats.nonFailedCount, 
                accent: 'warning' 
            },
            { 
                label: 'No Issues', 
                count: stats.noIssueCount, 
                accent: 'neutral' 
            }
        ];
    }

    addEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in StatisticsController ${event} listener:`, error);
                }
            });
        }
    }
}