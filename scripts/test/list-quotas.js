// test the performance for the list quotas API
import { Rate } from 'k6/metrics'
import harbor from 'k6/x/harbor'

import { Settings } from '../config.js'

const settings = Settings()

export let successRate = new Rate('success')

export let options = {
    setupTimeout: '6h',
    duration: '24h',
    vus: 500,
    iterations: 1000,
    thresholds: {
        'iteration_duration{scenario:default}': [
            `max>=0`,
        ],
        'iteration_duration{group:::setup}': [`max>=0`],
    }
};

export function setup() {
    harbor.initialize(settings.Harbor)

    const { total } = harbor.listQuotas({ page: 1, pageSize: 1 })

    console.log(`total quotas: ${total}`)

    return {
        quotasCount: total
    }
}

export default function ({ quotasCount }) {
    const pageSize = 15
    const pages = Math.ceil(quotasCount / pageSize)
    const page = Math.floor(Math.random() * pages) + 1

    try {
        harbor.listQuotas({ page, pageSize })
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.log(e)
    }
}
