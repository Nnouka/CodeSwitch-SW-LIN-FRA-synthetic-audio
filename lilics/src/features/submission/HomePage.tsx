import { AudioOutlined, RocketOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, Card, Col, Flex, Row, Space, Tag, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { PageTransition } from '../../components/ui/PageTransition'

export function HomePage() {
  const { Paragraph, Title } = Typography
  const navigate = useNavigate()

  return (
    <main className="page">
      <PageTransition>
        <Flex vertical gap="large" style={{ width: '100%' }}>
          <div>
            <Title level={2} style={{ marginBottom: 8 }}>
              Lilics Community Voice Collection
            </Title>
            <Paragraph>
              Help build a high-quality French-Swahili-Lingala code-switching speech dataset for
              public-interest AI.
            </Paragraph>
            <Space size="small" wrap>
              <Tag color="blue">fra-swa-lin</Tag>
              <Tag color="green">community sourced</Tag>
              <Tag color="purple">ethics-first consent</Tag>
            </Space>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Contributors" extra={<AudioOutlined />}>
                <Paragraph>
                  Read one prompt and record your voice directly in-browser. No file upload step required.
                </Paragraph>
                <Button type="primary" icon={<RocketOutlined />} onClick={() => navigate('/consent')}>
                  Start Contribution
                </Button>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Reviewers" extra={<SafetyCertificateOutlined />}>
                <Paragraph>
                  Review quality flags and approve or reject recordings before dataset packaging.
                </Paragraph>
                <Button onClick={() => navigate('/review')}>Open Reviewer Console</Button>
              </Card>
            </Col>
          </Row>
        </Flex>
      </PageTransition>
    </main>
  )
}
