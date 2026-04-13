import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import { ConsentPage } from '../features/consent/ConsentPage'
import { CollectPage } from '../features/submission/CollectPage'
import { HomePage } from '../features/submission/HomePage'
import { ReviewerPage } from '../features/reviewer/ReviewerPage'
import { ThankYouPage } from '../features/submission/ThankYouPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'consent', element: <ConsentPage /> },
      { path: 'collect', element: <CollectPage /> },
      { path: 'thank-you', element: <ThankYouPage /> },
      { path: 'review', element: <ReviewerPage /> },
    ],
  },
])
