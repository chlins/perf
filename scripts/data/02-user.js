// prepare users
import { Rate } from 'k6/metrics'
import counter from 'k6/x/counter'
import harbor from 'k6/x/harbor'

import { Settings } from '../config.js'
import { numberToPadString } from '../helpers.js'

const settings = Settings()

const totalIterations = settings.UsersCount

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

    return {
        userPrefix: `user-${Date.now()}`
    }
}

export default function ({ userPrefix }) {
    const suffix = numberToPadString(counter.up(), settings.UsersCount)

    try {
        harbor.createUser(`${userPrefix}-${suffix}`)
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.log(e)
    }
}
