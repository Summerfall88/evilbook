import paperTexture from "@/assets/paper-texture.png";

const NewspaperTexture = () => (
  <div
    className="pointer-events-none fixed inset-0 z-50 opacity-[0.08]"
    style={{
      backgroundImage: `url(${paperTexture})`,
      backgroundRepeat: "repeat",
      backgroundSize: "400px 400px",
      mixBlendMode: "overlay",
    }}
  />
);

export default NewspaperTexture;
