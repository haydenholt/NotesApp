import { DOMHelpers } from '../../core/utils/DOMHelpers.js';
import { SecurityUtils } from '../../core/utils/SecurityUtils.js';

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

        // Clear container
        this.statsContainer.textContent = '';

        const title = isSearchMode ? 'Search Results Stats' : 'Audit Stats';
        const titleClass = this.themeManager.combineClasses(
            'font-semibold text-lg mb-2',
            this.themeManager.getColor('text', 'primary')
        );

        // Create title element
        const titleDiv = SecurityUtils.createElement('div', title, titleClass);
        this.statsContainer.appendChild(titleDiv);

        if (stats.totalCompleted === 0) {
            const emptyStateClasses = this.themeManager.getEmptyStateClasses();
            const emptyDiv = SecurityUtils.createElement('div', 'No data available', emptyStateClasses.text);
            this.statsContainer.appendChild(emptyDiv);
        } else {
            this.appendStatsGrid(this.statsContainer, stats);
        }
    }

    appendStatsGrid(container, stats) {
        const gridClass = 'grid grid-cols-3 gap-4';
        const statsData = [
            { label: 'Fails', count: stats.failedCount, accent: 'error' },
            { label: 'Non-fails', count: stats.nonFailedCount, accent: 'warning' },
            { label: 'No Issues', count: stats.noIssueCount, accent: 'neutral' }
        ];

        const gridDiv = SecurityUtils.createElement('div', '', gridClass);
        
        statsData.forEach(stat => {
            const cardClasses = this.themeManager.getStatCardClasses(stat.accent);
            const labelColor = stat.accent === 'neutral'
                ? this.themeManager.getColor('text', 'secondary')
                : this.themeManager.getStatusClasses(stat.accent);
            const countColor = this.themeManager.getColor('text', 'primary');
            
            const cardDiv = SecurityUtils.createElement('div', '', cardClasses);
            const labelDiv = SecurityUtils.createElement('div', stat.label, `font-semibold ${labelColor}`);
            const countDiv = SecurityUtils.createElement('div', String(stat.count), `text-2xl ${countColor}`);
            
            cardDiv.appendChild(labelDiv);
            cardDiv.appendChild(countDiv);
            gridDiv.appendChild(cardDiv);
        });
        
        container.appendChild(gridDiv);
    }

    renderProjectFailRates(projectStats, date, isSearchMode = false) {
        if (!this.projectStatsContainer) return;

        // Clear container
        this.projectStatsContainer.textContent = '';

        const title = isSearchMode ? 'Search Results Project Fail Rates' : `Project Fail Rates (${date})`;
        const titleDiv = SecurityUtils.createElement('div', title, 'font-semibold text-lg mb-2');
        this.projectStatsContainer.appendChild(titleDiv);

        if (Object.keys(projectStats).length === 0) {
            const emptyStateClasses = this.themeManager.getEmptyStateClasses();
            const message = isSearchMode 
                ? 'No projects with data available in search results'
                : 'No projects with data available for this date';
            const emptyDiv = SecurityUtils.createElement('div', message, emptyStateClasses.text);
            this.projectStatsContainer.appendChild(emptyDiv);
        } else {
            this.appendProjectStatsGrid(this.projectStatsContainer, projectStats);
        }
    }

    appendProjectStatsGrid(container, projectStats) {
        const gridContainer = SecurityUtils.createElement('div', '', 'space-y-3');

        for (const [projectID, stats] of Object.entries(projectStats)) {
            const projectDiv = SecurityUtils.createElement('div');
            
            // Stats header
            const headerDiv = SecurityUtils.createElement('div', '', 'flex justify-between mb-1');
            const nameSpan = SecurityUtils.createElement('span', stats.displayID, 'font-medium');
            const statsText = `${stats.failRate}% (${stats.failed}/${stats.total}) • avg: ${stats.avgTime}`;
            const statsSpan = SecurityUtils.createElement('span', statsText);
            headerDiv.appendChild(nameSpan);
            headerDiv.appendChild(statsSpan);
            
            // Progress bar
            const progressClasses = this.themeManager.getFailRateProgressClasses();
            const progressDiv = SecurityUtils.createElement('div', '', `w-full ${progressClasses.container} rounded-full h-2.5 relative overflow-hidden`);
            
            const failsBar = SecurityUtils.createElement('div', '', `${progressClasses.fails} h-2.5 absolute`);
            failsBar.style.width = `${stats.failRate}%`;
            
            const nonFailsBar = SecurityUtils.createElement('div', '', `${progressClasses.nonFails} h-2.5 absolute`);
            nonFailsBar.style.width = `${stats.nonFailRate}%`;
            nonFailsBar.style.left = `${stats.failRate}%`;
            
            progressDiv.appendChild(failsBar);
            progressDiv.appendChild(nonFailsBar);
            
            projectDiv.appendChild(headerDiv);
            projectDiv.appendChild(progressDiv);
            gridContainer.appendChild(projectDiv);
        }

        container.appendChild(gridContainer);
    }

    renderEmptyState(isSearchMode = false) {
        if (this.statsContainer) {
            this.statsContainer.textContent = '';
            const title = isSearchMode ? 'Search Results Stats' : 'Audit Stats';
            const titleDiv = SecurityUtils.createElement('div', title, 'font-semibold text-lg mb-2');
            const emptyDiv = SecurityUtils.createElement('div', 'No data available', this.themeManager.getEmptyStateClasses().text);
            this.statsContainer.appendChild(titleDiv);
            this.statsContainer.appendChild(emptyDiv);
        }

        if (this.projectStatsContainer) {
            this.projectStatsContainer.textContent = '';
            const title = isSearchMode ? 'Search Results Project Fail Rates' : 'Project Fail Rates';
            const titleDiv = SecurityUtils.createElement('div', title, 'font-semibold text-lg mb-2');
            const emptyDiv = SecurityUtils.createElement('div', 'No data available', this.themeManager.getEmptyStateClasses().text);
            this.projectStatsContainer.appendChild(titleDiv);
            this.projectStatsContainer.appendChild(emptyDiv);
        }
    }

    clear() {
        if (this.statsContainer) {
            this.statsContainer.textContent = '';
        }
        if (this.projectStatsContainer) {
            this.projectStatsContainer.textContent = '';
        }
    }
}