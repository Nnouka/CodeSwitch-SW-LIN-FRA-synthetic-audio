import { SafetyCertificateOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Checkbox, Flex, Form, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { PageTransition } from '../../components/ui/PageTransition'

export function ConsentPage() {
  const { Paragraph, Title, Text } = Typography
  const navigate = useNavigate()

  function onSubmit() {
    navigate('/collect')
  }

  return (
    <main className="page">
      <PageTransition>
        <Card>
          <Flex vertical gap="middle" style={{ width: '100%' }}>
            <Title level={2} style={{ marginBottom: 0 }}>
              Consent
            </Title>
            <Paragraph>
              Before recording, please confirm consent for research usage of your voice clip and metadata.
            </Paragraph>
            <Alert
              showIcon
              type="info"
              icon={<SafetyCertificateOutlined />}
              description={
                <Text>
                  Your contribution supports multilingual research. You may stop at any time before submission.
                </Text>
              }
            />

            <Form
              layout="vertical"
              onFinish={() => {
                onSubmit()
              }}
            >
              <Form.Item
                name="consent"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value ? Promise.resolve() : Promise.reject(new Error('Consent is required to continue.')),
                  },
                ]}
              >
                <Checkbox>I am 18+ and I consent to participate in this data collection.</Checkbox>
              </Form.Item>

              <Button type="primary" htmlType="submit">
                Continue to Recording
              </Button>
            </Form>
          </Flex>
        </Card>
      </PageTransition>
    </main>
  )
}
