import { apiRequest } from './apiClient'

export type LanguageMix = 'fra-swa-lin'

export interface PromptItem {
  promptId: string
  text: string
  languageMix: LanguageMix
}

export interface PresignUploadResponse {
  uploadUrl: string
  objectKey: string
}

export interface FinalizeSubmissionResponse {
  submissionId: string
  status: 'queued' | 'processed'
}

interface MockPromptRecord extends PromptItem {
  hasAudio?: boolean
}

const USE_MOCK_TEXT_API = import.meta.env.VITE_USE_MOCK_TEXT_API === 'true'
const MOCK_JSONL_URL = '/mock/prompts.fra-swa-lin.sample.jsonl'
let cachedPromptRecords: MockPromptRecord[] | null = null

async function loadMockPromptRecords(): Promise<MockPromptRecord[]> {
  if (cachedPromptRecords) {
    return cachedPromptRecords
  }

  const response = await fetch(MOCK_JSONL_URL)
  if (!response.ok) {
    throw new Error(`Unable to load mock JSONL at ${MOCK_JSONL_URL}`)
  }

  const raw = await response.text()
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  cachedPromptRecords = lines.map((line) => JSON.parse(line) as MockPromptRecord)
  return cachedPromptRecords
}

async function getNextPromptWithoutAudioMock(): Promise<PromptItem> {
  const records = await loadMockPromptRecords()
  const usedPromptIds = new Set(JSON.parse(sessionStorage.getItem('mockUsedPromptIds') || '[]') as string[])

  const next = records.find(
    (record) => record.languageMix === 'fra-swa-lin' && !record.hasAudio && !usedPromptIds.has(record.promptId),
  )

  if (!next) {
    throw new Error('No remaining mock prompts without audio.')
  }

  usedPromptIds.add(next.promptId)
  sessionStorage.setItem('mockUsedPromptIds', JSON.stringify(Array.from(usedPromptIds)))

  return {
    promptId: next.promptId,
    text: next.text,
    languageMix: 'fra-swa-lin',
  }
}

export function getNextPromptWithoutAudio() {
  if (USE_MOCK_TEXT_API) {
    return getNextPromptWithoutAudioMock()
  }

  return apiRequest<PromptItem>('/prompts/next?languageMix=fra-swa-lin')
}

export function createPresignedUpload(promptId: string, contentType: string) {
  return apiRequest<PresignUploadResponse>('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({
      promptId,
      languageMix: 'fra-swa-lin',
      contentType,
    }),
  })
}

export function finalizeSubmission(payload: {
  promptId: string
  objectKey: string
  topicTag: string
  durationSec: number
}) {
  return apiRequest<FinalizeSubmissionResponse>('/submissions', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      languageMix: 'fra-swa-lin',
      source: 'web-recorder',
    }),
  })
}
