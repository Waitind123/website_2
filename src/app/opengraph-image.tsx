import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 10% 20%, rgba(0,200,255,0.25), rgba(4,9,18,1) 40%), radial-gradient(circle at 90% 20%, rgba(132,104,255,0.3), rgba(4,9,18,1) 50%), #040912",
          color: "#e8f3ff",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 8, opacity: 0.9 }}>LUMINA</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            marginTop: 24,
            maxWidth: 920,
            lineHeight: 1.12,
          }}
        >
          AI 创作社区 + 订阅变现
        </div>
        <div style={{ fontSize: 30, marginTop: 20, opacity: 0.85 }}>
          免费体验，Pro 解锁持续创作能力
        </div>
      </div>
    ),
    size,
  );
}
