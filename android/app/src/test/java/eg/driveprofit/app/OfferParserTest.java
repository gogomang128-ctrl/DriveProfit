package eg.driveprofit.app;

import static org.junit.Assert.*;

import org.junit.Test;

public class OfferParserTest {

  @Test
  public void arabicOffer() {
    assertArrayEquals(
      new double[] { 12.4, 85 },
      OfferParser.parse("١٢٫٤ كم\n٨٥ ج.م"),
      0.0001
    );
  }

  @Test
  public void englishOffer() {
    assertArrayEquals(
      new double[] { 9, 120 },
      OfferParser.parse("EGP 120\n9 km"),
      0.0001
    );
  }

  @Test
  public void ambiguousOffers() {
    assertNull(OfferParser.parse("12 km\n2 km\nEGP 70"));
    assertNull(OfferParser.parse("12 km\n70 EGP\nEGP 88"));
  }

  @Test
  public void incompleteOffers() {
    assertNull(OfferParser.parse("12 km"));
    assertNull(OfferParser.parse("EGP 90"));
    assertNull(OfferParser.parse("0 km\n90 EGP"));
  }
}
