import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { Card, Flex, Table, Tag, Typography } from 'antd'
import { PageTransition } from '../../components/ui/PageTransition'

interface ReviewerRow {
  key: string
  promptId: string
  status: 'pending' | 'flagged' | 'approved'
  durationSec: number
}

const sampleRows: ReviewerRow[] = [
  { key: '1', promptId: 'fra-swa-lin-0001', status: 'pending', durationSec: 11 },
  { key: '2', promptId: 'fra-swa-lin-0002', status: 'flagged', durationSec: 7 },
  { key: '3', promptId: 'fra-swa-lin-0004', status: 'approved', durationSec: 13 },
]

export function ReviewerPage() {
  const { Paragraph, Title } = Typography

  return (
    <main className="page">
      <PageTransition>
        <Flex vertical gap="large" style={{ width: '100%' }}>
          <div>
            <Title level={2} style={{ marginBottom: 8 }}>
              Reviewer Console
            </Title>
            <Paragraph>
              Triage submissions by status and prioritize flagged items for manual checks.
            </Paragraph>
          </div>

          <Card>
            <Table
              dataSource={sampleRows}
              pagination={false}
              columns={[
                { title: 'Prompt ID', dataIndex: 'promptId', key: 'promptId' },
                { title: 'Duration (s)', dataIndex: 'durationSec', key: 'durationSec' },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: ReviewerRow['status']) => {
                    if (status === 'approved') {
                      return (
                        <Tag icon={<CheckCircleOutlined />} color="success">
                          Approved
                        </Tag>
                      )
                    }

                    if (status === 'flagged') {
                      return (
                        <Tag icon={<WarningOutlined />} color="error">
                          Flagged
                        </Tag>
                      )
                    }

                    return (
                      <Tag icon={<ClockCircleOutlined />} color="processing">
                        Pending
                      </Tag>
                    )
                  },
                },
              ]}
            />
          </Card>
        </Flex>
      </PageTransition>
    </main>
  )
}
