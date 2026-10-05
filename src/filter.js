// QPEF in-process eye difference filter for the verified Quest Pro engine.
const engine = Process.getModuleByName('libtrackingengines.so');
if (engine.size !== 50614272) throw new Error('Unexpected tracking engine build');
const filterModule = Module.load('/data/local/tmp/qpef-filter.so');
const filterExport = filterModule.enumerateExports()
  .find(item => item.name === 'qpro_damp_gaze');
if (!filterExport) throw new Error('Native gaze filter export missing');
const update = new NativeFunction(
  filterExport.address, 'void',
  ['pointer', 'pointer', 'pointer', 'double', 'pointer', 'pointer']
);
const state = Memory.alloc(64);
state.writeByteArray(new Uint8Array(64));
const leftIn = Memory.alloc(16), rightIn = Memory.alloc(16);
const leftOut = Memory.alloc(16), rightOut = Memory.alloc(16);
let first = null, firstThread = 0, firstMs = 0;
let pairs = 0, changed = 0, skipped = 0;
let active = true;

function direction(pointer) {
  const x = pointer.add(0x300).readFloat();
  const y = pointer.add(0x304).readFloat();
  const z = pointer.add(0x308).readFloat();
  const norm = Math.hypot(x, y, z);
  if (!Number.isFinite(norm) || norm < 0.8 || norm > 1.2 || z <= 0) return null;
  return {
    yaw: Math.atan2(x, z) * 180 / Math.PI,
    pitch: Math.atan2(-y, Math.hypot(x, z)) * 180 / Math.PI,
    norm
  };
}

function writeDirection(pointer, yaw, pitch, norm) {
  const h = yaw * Math.PI / 180;
  const v = pitch * Math.PI / 180;
  pointer.add(0x300).writeFloat(Math.sin(h) * Math.cos(v) * norm);
  pointer.add(0x304).writeFloat(-Math.sin(v) * norm);
  pointer.add(0x308).writeFloat(Math.cos(h) * Math.cos(v) * norm);
}

const listener = Interceptor.attach(engine.base.add(0xB1F3E8), {
  onEnter() {
    if (!active) return;
    const eye = this.context.x19;
    const tag = eye.readU32() & 0xff;
    if (tag === 0) {
      first = eye;
      firstThread = this.threadId;
      firstMs = Date.now();
      return;
    }
    if (tag !== 1 || first === null || firstThread !== this.threadId ||
        Date.now() - firstMs > 2 || eye.add(0x30c).readU8() !== 1 ||
        first.add(0x30c).readU8() !== 1) {
      skipped++;
      first = null;
      return;
    }
    const left = direction(first), right = direction(eye);
    if (left === null || right === null) {
      skipped++;
      first = null;
      return;
    }
    leftIn.writeDouble(left.yaw); leftIn.add(8).writeDouble(left.pitch);
    rightIn.writeDouble(right.yaw); rightIn.add(8).writeDouble(right.pitch);
    update(state, leftIn, rightIn, Date.now() / 1000, leftOut, rightOut);
    const ly = leftOut.readDouble(), lp = leftOut.add(8).readDouble();
    const ry = rightOut.readDouble(), rp = rightOut.add(8).readDouble();
    writeDirection(first, ly, lp, left.norm);
    writeDirection(eye, ry, rp, right.norm);
    pairs++;
    if (Math.abs(ly - left.yaw) + Math.abs(ry - right.yaw) +
        Math.abs(lp - left.pitch) + Math.abs(rp - right.pitch) > 0.001) changed++;
    if (pairs % 3600 === 0) send({pairs, changed, skipped});
    first = null;
  }
});

rpc.exports = {
  stop() {
    active = false;
    listener.detach();
    return {pairs, changed, skipped};
  }
};

