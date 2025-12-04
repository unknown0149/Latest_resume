import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadJobsFromFile } from '../src/services/fileJobService.js'
import { logger } from '../src/utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  try {
    const searchTerm = process.argv.find((arg) => arg.startsWith('--search='))?.split('=')[1]
    const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1]
    const limit = limitArg ? parseInt(limitArg, 10) : 20

    const jobs = await loadJobsFromFile({ forceReload: true, enrichSkills: false })
    let filtered = jobs

    if (searchTerm) {
      const needle = searchTerm.toLowerCase()
      filtered = jobs.filter((job) => {
        const combined = `${job.title} ${job.company?.name || ''} ${job.description}`.toLowerCase()
        return combined.includes(needle)
      })
    }

    const sample = filtered.slice(0, limit)
    const summary = {
      totalJobs: jobs.length,
      matchedJobs: filtered.length,
      preview: sample.map((job) => ({
        jobId: job.jobId,
        title: job.title,
        company: job.company?.name,
        location: job.location?.city,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        skills: job.skills?.allSkills?.slice(0, 5) || []
      }))
    }

    const outputPath = path.join(__dirname, 'jobs-preview.json')
    await fs.promises.writeFile(outputPath, JSON.stringify(summary, null, 2))

    console.log(`Extracted ${summary.matchedJobs} jobs (showing ${sample.length}). Preview saved to ${outputPath}`)
  } catch (error) {
    logger.error('Failed to extract jobs from csv', error)
    process.exitCode = 1
  }
}

main()
