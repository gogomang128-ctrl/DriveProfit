import Pbf from "pbf";
// Minimal MVT road crossing a single tile; verifies binary decoding and drawing without network.
export function streetFixture() {
  const p = new Pbf();
  p.writeMessage(3, (_, layer) => {
    layer.writeStringField(1, "transportation");
    layer.writeVarintField(5, 256);
    layer.writeVarintField(15, 2);
    layer.writeMessage(2, (_, feature) => {
      feature.writeVarintField(3, 2);
      feature.writePackedVarint(4, [9, 0, 256, 10, 512, 0]);
    });
  });
  return Buffer.from(p.finish());
}
