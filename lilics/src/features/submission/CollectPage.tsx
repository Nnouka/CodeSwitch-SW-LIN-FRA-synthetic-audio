import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AudioOutlined, CheckCircleOutlined, LoadingOutlined, PauseCircleOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Flex, Form, Input, Modal, Space, Tag, Typography } from 'antd'
import gsap from 'gsap'
import { PageTransition } from '../../components/ui/PageTransition'
import {
  createPresignedUpload,
  finalizeSubmission,
  getNextPromptWithoutAudio,
  type PromptItem,
} from '../../services/contributionApi'
import { uploadWithPresignedUrl } from '../../services/upload'

export function CollectPage() {
  const { Paragraph, Text, Title } = Typography
  const navigate = useNavigate()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const startedAtRef = useRef<number>(0)
  const recordingDotRef = useRef<HTMLSpanElement | null>(null)
  const countdownNumberRef = useRef<HTMLDivElement | null>(null)

  const [prompt, setPrompt] = useState<PromptItem | null>(null)
  const [topicTag, setTopicTag] = useState('civic participation')
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [countdownSec, setCountdownSec] = useState<number | null>(null)
  const [durationSec, setDurationSec] = useState(0)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPrompt() {
      try {
        const nextPrompt = await getNextPromptWithoutAudio()
        setPrompt(nextPrompt)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load prompt')
      }
    }

    void loadPrompt()
  }, [])

  useEffect(() => {
    const dot = recordingDotRef.current
    if (!dot) {
      return
    }

    if (isRecording) {
      gsap.to(dot, {
        scale: 1.35,
        opacity: 0.35,
        duration: 0.6,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
      })
      return
    }

    if (countdownSec !== null) {
      gsap.to(dot, {
        scale: 1.2,
        opacity: 0.5,
        duration: 0.45,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
      })
      return
    }

    gsap.killTweensOf(dot)
    gsap.to(dot, { scale: 1, opacity: 1, duration: 0.2 })
  }, [countdownSec, isRecording])

  useEffect(() => {
    if (countdownSec === null) {
      return
    }

    if (countdownSec === 0) {
      setCountdownSec(null)
      void startRecordingNow()
      return
    }

    const timerId = window.setTimeout(() => {
      setCountdownSec((previous) => (previous === null ? null : previous - 1))
    }, 1000)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [countdownSec])

  useEffect(() => {
    if (countdownSec === null || !countdownNumberRef.current) {
      return
    }

    gsap.fromTo(
      countdownNumberRef.current,
      { scale: 0.7, autoAlpha: 0.4 },
      { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'back.out(1.7)' },
    )
  }, [countdownSec])

  useEffect(() => {
    if (!recordedBlob) {
      setRecordedAudioUrl(null)
      return
    }

    const audioUrl = URL.createObjectURL(recordedBlob)
    setRecordedAudioUrl(audioUrl)

    return () => {
      URL.revokeObjectURL(audioUrl)
    }
  }, [recordedBlob])

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current
      if (recorder?.state === 'recording') {
        recorder.stop()
      }
    }
  }, [])

  async function startRecordingNow() {
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const elapsedMs = Date.now() - startedAtRef.current

        setRecordedBlob(blob)
        setDurationSec(Math.max(1, Math.round(elapsedMs / 1000)))
        stream.getTracks().forEach((track) => track.stop())
      }

      startedAtRef.current = Date.now()
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch (recordError) {
      setError(recordError instanceof Error ? recordError.message : 'Microphone access failed')
    }
  }

  function startRecordingWithCountdown() {
    if (isRecording || countdownSec !== null || isBusy) {
      return
    }

    setError(null)
    setCountdownSec(5)
  }

  function stopRecording() {
    if (countdownSec !== null) {
      setCountdownSec(null)
      return
    }

    const recorder = mediaRecorderRef.current
    if (recorder?.state === 'recording') {
      recorder.stop()
      setIsRecording(false)
    }
  }

  async function submitRecording() {
    if (!prompt || !recordedBlob) {
      return
    }

    setIsBusy(true)
    setError(null)

    try {
      const presigned = await createPresignedUpload(prompt.promptId, recordedBlob.type || 'audio/webm')
      await uploadWithPresignedUrl(presigned.uploadUrl, recordedBlob)
      await finalizeSubmission({
        promptId: prompt.promptId,
        objectKey: presigned.objectKey,
        topicTag,
        durationSec,
      })

      navigate('/thank-you')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Submission failed')
    } finally {
      setIsBusy(false)
    }
  }

  const canSubmit = Boolean(prompt && recordedBlob && !isRecording && !isBusy)
  const isCountingDown = countdownSec !== null
  let recordingStatusText = 'Ready to record'
  if (isCountingDown) {
    recordingStatusText = `Starting in ${countdownSec}s`
  } else if (isRecording) {
    recordingStatusText = 'Recording in progress'
  } else if (recordedBlob) {
    recordingStatusText = 'Recording stopped'
  }

  return (
    <main className="page">
      <PageTransition>
        <Flex vertical gap="large" style={{ width: '100%' }}>
          <div>
            <Title level={2} style={{ marginBottom: 8 }}>
              Record Your Voice
            </Title>
            <Paragraph>
              Language mix is fixed to <Text strong>French + Swahili + Lingala</Text>. Read the prompt as
              naturally as possible using your everyday code-switching style.
            </Paragraph>
            <Tag color="geekblue">fra-swa-lin only</Tag>
          </div>

          <Card title="Prompt to Read">
            {prompt ? (
              <Paragraph style={{ fontSize: 16, marginBottom: 0 }}>{prompt.text}</Paragraph>
            ) : (
              <Space>
                <LoadingOutlined />
                <Text>Loading next prompt that has no audio yet...</Text>
              </Space>
            )}
          </Card>

          <Card title="Recording Status">
            <Flex vertical gap="middle" style={{ width: '100%' }}>
              <div className="recording-indicator">
                <span
                  ref={recordingDotRef}
                  className={`recording-dot ${isRecording ? 'live' : ''} ${isCountingDown ? 'countdown' : ''}`}
                />
                <Text strong>{recordingStatusText}</Text>
              </div>

              {isRecording ? (
                <Alert
                  type="warning"
                  showIcon
                  icon={<AudioOutlined />}
                  description={
                    <>
                      <Text strong>Live recording.</Text> Speak clearly into your microphone and press Stop
                      Recording when done.
                    </>
                  }
                />
              ) : null}

              {!isRecording && recordedBlob ? (
                <Alert
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                  description={
                    <>
                      <Text strong>Recording saved.</Text> Duration: {durationSec}s. Review and submit when ready.
                    </>
                  }
                />
              ) : null}

              {error ? (
                <Alert
                  type="error"
                  showIcon
                  description={
                    <>
                      <Text strong>Action failed.</Text> {error}
                    </>
                  }
                />
              ) : null}

              {recordedAudioUrl ? (
                <audio controls src={recordedAudioUrl} style={{ width: '100%' }}>
                  <track kind="captions" srcLang="en" src="data:text/vtt,WEBVTT" default />
                </audio>
              ) : (
                <Text type="secondary">No audio recorded yet.</Text>
              )}

              <Flex vertical gap="small" style={{ width: '100%' }}>
                <Button
                  block
                  type="primary"
                  size="large"
                  icon={<AudioOutlined />}
                  onClick={startRecordingWithCountdown}
                  disabled={isRecording || isBusy || isCountingDown}
                >
                  {isCountingDown ? `Starting in ${countdownSec}s...` : 'Start Recording'}
                </Button>
                <Button
                  block
                  danger
                  size="large"
                  icon={<PauseCircleOutlined />}
                  onClick={stopRecording}
                  disabled={(!isRecording && !isCountingDown) || isBusy}
                >
                  {isCountingDown ? 'Cancel Countdown' : 'Stop Recording'}
                </Button>
              </Flex>
            </Flex>
          </Card>

          <Card title="Submission Details">
            <Form
              layout="vertical"
              onFinish={() => {
                void submitRecording()
              }}
            >
              <Form.Item label="Language mix">
                <Input value="French + Swahili + Lingala" readOnly />
              </Form.Item>

              <Form.Item
                label="Topic tag"
                required
                rules={[{ required: true, message: 'Please provide a topic tag before submitting.' }]}
              >
                <Input
                  placeholder="e.g. civic participation"
                  value={topicTag}
                  onChange={(event) => setTopicTag(event.target.value)}
                />
              </Form.Item>

              <Button block type="primary" size="large" htmlType="submit" loading={isBusy} disabled={!canSubmit}>
                {isBusy ? 'Submitting...' : 'Submit Clip'}
              </Button>
            </Form>
          </Card>
        </Flex>

        <Modal
          open={isCountingDown}
          footer={null}
          closable={false}
          centered
          width={360}
          maskClosable={false}
          title="Get Ready"
        >
          <Flex vertical align="center" gap="middle">
            <Text type="secondary">Recording starts automatically in</Text>
            <div ref={countdownNumberRef} className="countdown-number">
              {countdownSec}
            </div>
            <Button danger onClick={stopRecording}>
              Cancel Countdown
            </Button>
          </Flex>
        </Modal>
      </PageTransition>
    </main>
  )
}
