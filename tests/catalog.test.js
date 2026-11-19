import test from "node:test";
import assert from "node:assert/strict";
import records from "../vehicles_egypt.json" with { type: "json" };
import { resolveVehicle, vehicles } from "../src/engine.js";
test("batch 1 covers all named vehicles and four Corolla generations", () => {
  const expected =
    `nissan_sunny_n16 nissan_sunny_n17 nissan_sentra_b17 chevrolet_optra_15 chevrolet_aveo_t250 chevrolet_lanos hyundai_accent_rb hyundai_elantra_hd hyundai_elantra_ad hyundai_elantra_cn7 hyundai_verna_16 toyota_corolla_e120 toyota_corolla_e140 toyota_corolla_e170 toyota_corolla_e210 toyota_yaris_xp90 suzuki_dzire_12 suzuki_ciaz_15 suzuki_swift_12 suzuki_alto_800 suzuki_spresso_10 kia_cerato_yd kia_rio_ub kia_picanto_ta renault_logan_ii renault_sandero_stepway renault_megane_iv renault_taliant_tce mitsubishi_lancer_cs3 mitsubishi_lancer_ex mitsubishi_attrage fiat_tipo_14_mt fiat_tipo_16_at fiat_grande_punto_14 fiat_shahin_16 lada_granta_16 byd_f3_15_mt byd_l3_15 chery_arrizo_5 chery_tiggo_3 chery_tiggo_7 chery_tiggo_8 mg_5_15 mg_6_15t mg_zs_15 mg_rx5_15t dongfeng_shine_sport geely_emgrand_7 geely_coolray_sx11 changan_alsvin_15 changan_eado_dt proton_saga_13 baic_u5_plus`.split(
      " ",
    );
  const ids = new Set(records.map((x) => x.id));
  assert.equal(ids.size, records.length);
  for (const id of expected) assert.ok(ids.has(id), id);
});
test("catalog integrity and decimal reciprocal", () => {
  for (const x of records) {
    assert.match(x.id, /^[a-z0-9_]+$/);
    assert.equal(x.type, "car");
    for (const label of [x.brand, x.model])
      assert.match(label, /[\u0600-\u06ff].* \/ .*?[a-z]/i);
    assert.ok([80, 92, 95].includes(x.fuel_type));
    assert.ok(x.engine_cc > 0 && x.tank_capacity_liters > 0);
    let {
      liters_per_100km_city: c,
      liters_per_100km_highway: h,
      liters_per_100km_avg: a,
    } = x;
    assert.ok(c >= a && a >= h && h > 0);
    assert.equal(Math.round((c * 0.6 + h * 0.4) * 100) / 100, a);
    assert.equal(+(100 / a).toFixed(2), x.km_per_liter_avg);
    assert.equal(resolveVehicle(x.id).rate, a);
  }
});
test("existing selections survive catalog upgrade", () => {
  assert.equal(resolveVehicle(2).id, "nissan_sunny_n17");
  assert.equal(resolveVehicle(3).id, "toyota_corolla_e210");
  assert.equal(resolveVehicle("missing"), vehicles[0]);
});
