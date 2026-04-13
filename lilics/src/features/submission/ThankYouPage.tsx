import { Button, Result, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import { PageTransition } from '../../components/ui/PageTransition'

export function ThankYouPage() {
  const navigate = useNavigate()

  return (
    <main className="page">
      <PageTransition>
        <Result
          status="success"
          title="Thank you for your contribution"
          subTitle="Your recording has been received and queued for quality review."
          extra={
            <Space>
              <Button type="primary" onClick={() => navigate('/collect')}>
                Submit Another Clip
              </Button>
              <Button onClick={() => navigate('/')}>Back to Home</Button>
            </Space>
          }
        />
      </PageTransition>
    </main>
  )
}
