import { DOMHelpers } from '../../core/utils/DOMHelpers.js';

export class StatisticsView {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.statsContainer = null;
        this.projectStatsContainer = null;
    }

    render(statsElement, projectStatsElement) {
        this.statsContainer = statsElement;
        this.projectStatsContainer = projectStatsElement;
    }

    renderDailyStatistics(stats, isSearchMode = false) {
        if (!this.statsContainer) return;

        const title = isSearchMode ? 'Search Results Stats' : 'Audit Stats';
        const titleClass = this.themeManager.combineClasses(
            'font-semibold text-lg mb-2',
            this.themeManager.getColor('text', 'primary')
        );

        let html = `<div class="${titleClass}">${title}</div>`;

        if (stats.totalCompleted === 0) {
            const emptyStateClasses = this.themeManager.getEmptyStateClasses();
            html += `<div class="${emptyStateClasses.text}">No data available</div>`;
        } else {
            html += this.renderStatsGrid(stats);
        }

        this.statsContainer.innerHTML = html;
    }

    renderStatsGrid(stats) {
        const gridClass = 'grid grid-cols-3 gap-4';
        const statsData = [
            { label: 'Fails', count: stats.failedCount, accent: 'error' },
            { label: 'Non-fails', count: stats.nonFailedCount, accent: 'warning' },
            { label: 'No Issues', count: stats.noIssueCount, accent: 'neutral' }
        ];

        let html = `<div class="${gridClass}">`;
        
        statsData.forEach(stat => {
            const cardClasses = this.themeManager.getStatCardClasses(stat.accent);
            const labelColor = stat.accent === 'neutral'
                ? this.themeManager.getColor('text', 'secondary')
                : this.themeManager.getStatusClasses(stat.accent);
            const countColor = this.themeManager.getColor('text', 'primary');
            
            html += `
                <div class="${cardClasses}">
                    <div class="font-semibold ${labelColor}">${stat.label}</div>
                    <div class="text-2xl ${countColor}">${stat.count}</div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    renderProjectFailRates(projectStats, date, isSearchMode = false) {
        if (!this.projectStatsContainer) return;

        const title = isSearchMode ? 'Search Results Project Fail Rates' : `Project Fail Rates (${date})`;
        let html = `<div class="font-semibold text-lg mb-2">${title}</div>`;

        if (Object.keys(projectStats).length === 0) {
            const emptyStateClasses = this.themeManager.getEmptyStateClasses();
            const message = isSearchMode 
                ? 'No projects with data available in search results'
                : 'No projects with data available for this date';
            html += `<div class="${emptyStateClasses.text}">${message}</div>`;
        } else {
            html += this.renderProjectStatsGrid(projectStats);
        }

        this.projectStatsContainer.innerHTML = html;
    }

    renderProjectStatsGrid(projectStats) {
        let html = '<div class="space-y-3">';

        for (const [projectID, stats] of Object.entries(projectStats)) {
            html += `
                <div>
                    <div class="flex justify-between mb-1">
                        <span class="font-medium">${stats.displayID}</span>
                        <span>${stats.failRate}% (${stats.failed}/${stats.total}) • avg: ${stats.avgTime}</span>
                    </div>
                    <div class="w-full ${this.themeManager.getFailRateProgressClasses().container} rounded-full h-2.5 relative overflow-hidden">
                        <div class="${this.themeManager.getFailRateProgressClasses().fails} h-2.5 absolute" style="width: ${stats.failRate}%"></div>
                        <div class="${this.themeManager.getFailRateProgressClasses().nonFails} h-2.5 absolute" style="width: ${stats.nonFailRate}%; left: ${stats.failRate}%"></div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    renderEmptyState(isSearchMode = false) {
        if (this.statsContainer) {
            const title = isSearchMode ? 'Search Results Stats' : 'Audit Stats';
            this.statsContainer.innerHTML = `
                <div class="font-semibold text-lg mb-2">${title}</div>
                <div class="${this.themeManager.getEmptyStateClasses().text}">No data available</div>
            `;
        }

        if (this.projectStatsContainer) {
            const title = isSearchMode ? 'Search Results Project Fail Rates' : 'Project Fail Rates';
            this.projectStatsContainer.innerHTML = `
                <div class="font-semibold text-lg mb-2">${title}</div>
                <div class="${this.themeManager.getEmptyStateClasses().text}">No data available</div>
            `;
        }
    }

    clear() {
        if (this.statsContainer) {
            this.statsContainer.innerHTML = '';
        }
        if (this.projectStatsContainer) {
            this.projectStatsContainer.innerHTML = '';
        }
    }
}