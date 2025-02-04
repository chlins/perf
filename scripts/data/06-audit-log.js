// prepare audit logs
import { SharedArray } from 'k6/data'
import { Rate } from 'k6/metrics'
import counter from 'k6/x/counter'
import harbor from 'k6/x/harbor'

import { Settings } from '../config.js'
import { randomItem, getProjectName, getRepositoryName, getArtifactTag } from '../helpers.js'

const settings = Settings()

const existsAuditLogsCount = settings.ProjectsCount +
    settings.ProjectsCount * settings.RepositoriesCountPerProject * settings.ArtifactsCountPerRepository * settings.ArtifactTagsCountPerArtifact

const totalIterations = Math.max(1, settings.AuditLogsCount - existsAuditLogsCount)

let artifacts = new SharedArray('artifacts', function () {
    const results = []

    for (let i = 0; i < settings.ProjectsCount; i++) {

        for (let j = 0; j < settings.RepositoriesCountPerProject; j++) {

            for (let k = 0; k < settings.ArtifactsCountPerRepository; k++) {

                results.push({
                    projectName: getProjectName(settings, i),
                    repositoryName: getRepositoryName(settings, j),
                    tag: getArtifactTag(settings, k),
                })
            }
        }
    }

    return results
});

export let successRate = new Rate('success')

export let options = {
    setupTimeout: '6h',
    duration: '24h',
    vus:  Math.min(settings.VUS, totalIterations),
    iterations: totalIterations,
    thresholds: {
        'success': ['rate>=1'],
        'iteration_duration{scenario:default}': [
            `max>=0`,
        ],
        'iteration_duration{group:::setup}': [`max>=0`],
    }
};

export function setup() {
    harbor.initialize(settings.Harbor)
}

export default function () {
    const i = counter.up() - 1

    const a = randomItem(artifacts)

    const ref = `${a.projectName}/${a.repositoryName}:${a.tag}`

    try {
        harbor.getManifest(ref)
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.log(e)
    }
}
