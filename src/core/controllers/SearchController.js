import { NotesRepository } from '../data/NotesRepository.js';
import { DateUtils } from '../utils/DateUtils.js';

export class SearchController {
    constructor(appState, themeManager) {
        this.appState = appState;
        this.themeManager = themeManager;
        this.searchResults = [];
        
        this.listeners = {
            searchStarted: [],
            searchCompleted: [],
            searchCleared: []
        };
    }

    searchNotes(query) {
        if (!query || query.trim() === '') {
            this.clearSearch();
            return [];
        }

        const trimmedQuery = query.trim();
        this.appState.setSearchState(true, trimmedQuery);
        this.notifyListeners('searchStarted', { query: trimmedQuery });

        const results = NotesRepository.searchNotes(trimmedQuery);
        
        const enhancedResults = results.map(result => {
            return {
                ...result,
                formattedDate: DateUtils.formatDate(result.dateKey),
                displayIndex: this.calculateDisplayIndex(result.dateKey, result.id, result.note)
            };
        });

        this.searchResults = enhancedResults;
        this.notifyListeners('searchCompleted', { 
            query: trimmedQuery, 
            results: enhancedResults,
            count: enhancedResults.length 
        });

        return enhancedResults;
    }

    calculateDisplayIndex(dateKey, noteId, note) {
        if (note.canceled) return null;
        
        const allNotesForDate = NotesRepository.getNotesForDate(dateKey);
        const nonCanceledNotes = Object.entries(allNotesForDate)
            .filter(([, noteData]) => !noteData.canceled)
            .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10));
        
        const index = nonCanceledNotes.findIndex(([id]) => id === String(noteId));
        return index !== -1 ? index + 1 : nonCanceledNotes.length + 1;
    }

    clearSearch() {
        this.appState.setSearchState(false, '');
        this.searchResults = [];
        this.notifyListeners('searchCleared', {});
    }

    getSearchResults() {
        return this.searchResults;
    }

    isSearchActive() {
        return this.appState.getSearchState().isActive;
    }

    getCurrentQuery() {
        return this.appState.getSearchState().query;
    }

    getSearchStatistics() {
        if (!this.isSearchActive() || this.searchResults.length === 0) {
            return {
                totalResults: 0,
                failedCount: 0,
                nonFailedCount: 0,
                noIssueCount: 0
            };
        }

        let failedCount = 0;
        let nonFailedCount = 0;
        let noIssueCount = 0;

        this.searchResults.forEach(({ note }) => {
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
            totalResults: this.searchResults.length,
            failedCount,
            nonFailedCount,
            noIssueCount
        };
    }

    getSearchProjectFailRates() {
        if (!this.isSearchActive() || this.searchResults.length === 0) {
            return {};
        }

        const projectStats = {};

        this.searchResults.forEach(({ note }) => {
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

        return projectStats;
    }

    navigateToResult(dateKey, noteId) {
        this.clearSearch();
        
        this.notifyListeners('navigateToResult', {
            dateKey,
            noteId,
            shouldHighlight: true
        });
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
                    console.error(`Error in SearchController ${event} listener:`, error);
                }
            });
        }
    }
}