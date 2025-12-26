import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FF6B35',
          borderRadius: '40px',
        }}
      >
        {/* P lettermark with lock */}
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M35 17.5H70C87.6731 17.5 105 30.5964 105 52.5C105 74.4036 87.6731 87.5 70 87.5H52.5V122.5H35V17.5Z"
            fill="white"
          />
          <path
            d="M52.5 35V70H70C76.9036 70 87.5 64.4036 87.5 52.5C87.5 40.5964 76.9036 35 70 35H52.5Z"
            fill="#0A0A0A"
          />
          {/* Small lock accent */}
          <rect x="78.75" y="96.25" width="35" height="26.25" rx="4.375" fill="white" />
          <circle cx="96.25" cy="109.375" r="4.375" fill="#FF6B35" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
