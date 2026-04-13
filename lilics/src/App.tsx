import { useEffect, useRef, useState } from 'react'
import {
  AudioOutlined,
  CheckSquareOutlined,
  HomeOutlined,
  MenuOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Button, Drawer, Grid, Layout, Menu, Typography } from 'antd'
import gsap from 'gsap'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

function App() {
  const { Header, Content } = Layout
  const { Title } = Typography
  const { useBreakpoint } = Grid
  const screens = useBreakpoint()
  const location = useLocation()
  const navigate = useNavigate()
  const headerShellRef = useRef<HTMLDivElement | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!headerShellRef.current) {
      return
    }

    gsap.fromTo(headerShellRef.current, { y: -20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45 })
  }, [])

  const selectedKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`
  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: 'Home' },
    { key: '/consent', icon: <SafetyCertificateOutlined />, label: 'Consent' },
    { key: '/collect', icon: <AudioOutlined />, label: 'Collect' },
    { key: '/review', icon: <CheckSquareOutlined />, label: 'Review' },
  ]
  const isMobile = !screens.md

  return (
    <Layout className="layout">
      <Header className="header">
        <div className="header-shell" ref={headerShellRef}>
          <div className="header-brand">
            <AudioOutlined />
            <Title level={4} style={{ color: '#fff', margin: 0 }}>
              Lilics
            </Title>
          </div>
          {isMobile ? (
            <>
              <Button
                className="mobile-menu-trigger"
                icon={<MenuOutlined />}
                type="text"
                aria-label="Open navigation menu"
                onClick={() => setIsMobileMenuOpen(true)}
              />
              <Drawer
                placement="right"
                open={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                title="Navigation"
              >
                <Menu
                  mode="inline"
                  selectedKeys={[selectedKey]}
                  items={menuItems}
                  onClick={({ key }) => {
                    navigate(key)
                    setIsMobileMenuOpen(false)
                  }}
                />
              </Drawer>
            </>
          ) : (
            <Menu
              theme="dark"
              mode="horizontal"
              selectedKeys={[selectedKey]}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
              style={{ minWidth: 420, background: 'transparent', flex: 1 }}
            />
          )}
        </div>
      </Header>
      <Content>
        <Outlet />
      </Content>
    </Layout>
  )
}

export default App
