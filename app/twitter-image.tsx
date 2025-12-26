import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Privy - The Private AI Coach for Founders & Leaders';
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Shield Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
          }}
        >
          <svg
            width="100"
            height="100"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M60 10L100 30V60C100 80 90 95 60 110C30 95 20 80 20 60V30L60 10Z"
              fill="#FF6B35"
            />
            <rect x="50" y="55" width="20" height="25" rx="2" fill="white" />
            <path
              d="M55 55V48C55 45.2386 57.2386 43 60 43C62.7614 43 65 45.2386 65 48V55"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="60" cy="65" r="3" fill="#0A0A0A" />
            <rect x="58.5" y="65" width="3" height="8" fill="#0A0A0A" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px',
            letterSpacing: '-0.02em',
          }}
        >
          Privy
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: '#9CA3AF',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: 1.3,
          }}
        >
          The Private AI Coach for Founders & Leaders
        </div>

        {/* Badge */}
        <div
          style={{
            marginTop: '32px',
            padding: '10px 20px',
            background: 'rgba(255, 107, 53, 0.1)',
            border: '2px solid #FF6B35',
            borderRadius: '999px',
            color: '#FF6B35',
            fontSize: '18px',
            fontWeight: '600',
          }}
        >
          Radically Private
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
