# DMIU Undertaking Letter — Ajman Municipality (revised)

`DMIU_Undertaking_Letter_Ajman_Municipality_168.pdf` is a revised version of the
undertaking and request-for-approval letter from **DMIU Building Contracting
(S.P.S) L.L.C.** to the Ajman Municipality and Planning Department regarding the
building permit for *Rockhill Tower*.

## What changed

The only edit is the stated workforce in paragraph 2:

> We confirm that DMIU is actively mobilizing a workforce of **168** labourers for
> the Project.

(previously **200**). This matches the current employee count of **168** for the
establishment **D M I U BUILDING CONTRACTING S P S L L C** (Ajman, MOHRE code
2692457), whose owner / authorized signatory is the same partner,
**Dzhabrail Uruskhanov**.

Everything else is preserved exactly: the DMIU logo, reference
`DMIU/AJM/2026/06-001`, date, signature, UAE PASS digital-signature block,
company stamp and footer.

## Regenerating

The source letter is a flat scanned/image PDF, so the change is applied as a
localised, watermark-aware image patch (see `scripts/revise_undertaking_168.py`):

```
python3 scripts/revise_undertaking_168.py <original_scan>.pdf \
    documents/dmiu/DMIU_Undertaking_Letter_Ajman_Municipality_168.pdf
```
