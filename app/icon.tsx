import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';
export const alt = 'Toy Formaturas';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #26102f 0%, #7e188d 100%)'
        }}
      >
        <img
          alt=""
          src={new URL('../public/toy-logo-chroma.png', import.meta.url).toString()}
          style={{
            width: 1670,
            height: 405,
            objectFit: 'contain',
            transform: 'translateX(0)'
          }}
        />
      </div>
    ),
    size
  );
}
