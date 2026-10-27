// Sample AS/400 (IBM i) Spool Files (Fixed-width Monospace Printouts)
// and Structured Data for Testing Validoc-style Remapping & PDF Export

export const SAMPLE_SPOOL_FATTURA = `5770SS1 V7R4M0 190412               REPORT DI EMISSIONE FATTURA VENDITA              PAGINA:     1
SISTEMA: S102934X       LIBRERIA: FATTUR01         FILE SPOOL: QPRINT           DATA: 24/10/26
------------------------------------------------------------------------------------------------------------------------------------
MITTENTE:                                                                   DOCUMENTO: FATTURA ACCOMPAGNATORIA
ACCIAIERIE & METALLI ITALIA S.P.A.                                          NUMERO:    FA-2026/008492
VIA DELL'INDUSTRIA 45 - 20100 MILANO (MI)                                   DATA DOC:  24/10/2026
PARTITA IVA: IT03948572019  COD.FISC: 03948572019                          COD.CLIENTE: C004829
REG.IMPRESE MI-201948  CAP.SOC. EUR 2.500.000 I.V.                          VALUTA:    EUR
------------------------------------------------------------------------------------------------------------------------------------
INTESTATARIO / SPETTABILE:                                  LUOGO DI DESTINAZIONE / CONSEGNA MERCI:
BEMA LOGISTICS & TRANSPORT S.R.L.                           BEMA HUB LOGISTICO NORD
VIA E. MATTEI, 18                                           STRADA PROVINCIALE 12 - KM 4.2
24040 STEZZANO (BG) - ITALIA                                24044 DALMINE (BG)
PARTITA IVA: IT08472910963  CODICE SDI: M5UXCR1             REF: SIG.REBICI / RICEZIONE MERCI
------------------------------------------------------------------------------------------------------------------------------------
PAGAMENTO: RIBA 60 GG D.F. FINE MESE                        BANCA D'APPOGGIO: INTESA SANPAOLO - IBAN: IT60X0306909606100000012345
SCADENZA:  31/12/2026                                       VETTORE: BRT CORRIERE ESPRESSO - PORTO: FRANCO
------------------------------------------------------------------------------------------------------------------------------------
COD. ARTICOLO   DESCRIZIONE ARTICOLO / PRESTAZIONE               UM    QUANTITA   PREZZO UNIT    SCONTO %    IMPORTO TOT    IVA %
------------------------------------------------------------------------------------------------------------------------------------
PR-LAM-INOX304  LAMIERA ACCIAIO INOX AISI 304 2000X1000 SP.2MM   NR       15.00        84.5000       5.00        1204.12    22.00
PR-TUB-QUAD40   TUBOLARE QUADRO 40X40X2 INOX 6MT LUCIDATO        MT       48.00        12.8000       0.00         614.40    22.00
PR-VITI-M8X30   KIT BULLONI + DADI AUTOBLOCCANTI M8X30 INOX A2   CF       10.00         18.5000      10.00         166.50    22.00
PR-RACC-90G     RACCORDO A GOMITO 90 GRADI A SALDARE DN50 PN16   NR       24.00          9.2000       0.00         220.80    22.00
PR-TRASF-SPEZ   LAVORAZIONE SPECIALE TAGLIO LASER SU MISURA      ORE       4.50        65.0000       0.00         292.50    22.00
PR-IMB-PALLET   PALLET IN LEGNO TRATTATO HT ISPM-15 120X80       NR        2.00         15.0000       0.00          30.00    22.00
------------------------------------------------------------------------------------------------------------------------------------
TOTALE COLLI: 4      PESO LORDO KG: 420.50     PESO NETTO KG: 395.00     CAUSALE: VENDITA DIRETTA
CODICE A BARRE SPEDIZIONE / TRACKING: *FA2026008492C004829*
NOTE: CONSEGNA ENTRO LE ORE 12:00 - CONTROLLARE INTEGRITA IMBALLO PRIMA DI ACCETTARE CON RISERVA.
------------------------------------------------------------------------------------------------------------------------------------
RIEPILOGO IMPOSTE ED ESENZIONI:
ALIQUOTA IVA         IMPONIBILE EUR           IMPOSTA IVA EUR           TOTALE PARZIALE
  22.00 %                  2528.32                    556.23                   3084.55
------------------------------------------------------------------------------------------------------------------------------------
TOTALE MERCE:           EUR    2528.32
SPESE TRASPORTO:        EUR       0.00
TOTALE IMPONIBILE:      EUR    2528.32
TOTALE IMPOSTA IVA:     EUR     556.23
------------------------------------------------------------------------------------------------------------------------------------
TOTALE DOCUMENTO A PAGARE:                       EUR    3084.55
====================================================================================================================================
DOCUMENTO EMESSO DA SISTEMA GESTIONALE IBM AS/400 (POWER SYSTEM i) - VALIDATO PER ARCHIVIAZIONE SOSTITUTIVA`;

export const SAMPLE_SPOOL_DDT = `5770SS1 V7R4M0 190412                  DOCUMENTO DI TRASPORTO (D.D.T.)                 PAGINA:     1
SISTEMA: AS400PRD       LIBRERIA: LOGIST01         FILE SPOOL: QDDT             DATA: 25/10/26
------------------------------------------------------------------------------------------------------------------------------------
MITTENTE: LOGISTICA BEMA EXPRESS S.P.A. - VIA ROMA 100, 20121 MILANO - P.IVA: 09876543210
DESTINATARIO: MECCANICA INDUSTRIALE VENETA SRL - VIA MARCONI 22, 35100 PADOVA (PD) - P.IVA: 01122334455
LUOGO DI CONSEGNA: MECCANICA VENETA STABILIMENTO 2 - VIA ZONA ARTIGIANALE 8, 35010 CADONEGHE (PD)
D.D.T. NUMERO: DDT-2026/04912            DATA: 25/10/2026            CAUSALE: CONTO LAVORAZIONE ESTERNA
VETTORE: TRASPORTI RAPIDI NORD SRL       TARGA: FP892ZK             DATA RITIRO: 25/10/2026 ORE 14:30
------------------------------------------------------------------------------------------------------------------------------------
POS  CODICE ARTICOLO    DESCRIZIONE BENI TRASPORTATI                     U.M.      QUANTITA    PESO KG   COLLI
------------------------------------------------------------------------------------------------------------------------------------
001  ALB-MEC-450        ALBERO TRASMISSIONE IN ACCIAIO C45 TORNITO       PZ           30.00     150.00       2
002  ING-ELIC-120       INGRANAGGIO ELICOIDALE RETTIFICATO MOD. 4        PZ           60.00      90.00       1
003  CUSC-SKF-6208      CUSCINETTO A SFERE RADIALE SCHERMATO 2RS         PZ          120.00      45.00       1
004  FLANG-DN100        FLANGIA INOX FORATA SECONDO DISEGNO TECNICO 3    PZ           15.00      60.00       1
------------------------------------------------------------------------------------------------------------------------------------
TOTALE COLLI: 5         PESO TOTALE KG: 345.00     ASPETTO BENI: CASSE SU PALLET     PORTO: ASSEGNATO
BARCODE TRASPORTO: *DDT202604912*
FIRMA VETTORE: ...................................   FIRMA DESTINATARIO: ...................................`;

export const SAMPLE_SPOOL_ORDINE = `5770SS1 V7R4M0 190412                  ORDINE DI ACQUISTO FORNITORE                    PAGINA:     1
SISTEMA: AS400PRD       LIBRERIA: ACQUIS01         FILE SPOOL: QORD             DATA: 26/10/26
------------------------------------------------------------------------------------------------------------------------------------
FORNITORE: ACCIAI SPECIALI BERGAMO S.R.L. - VIA DEI MILLE 14, 24122 BERGAMO (BG)
NUMERO ORDINE: ORD-2026/11029     DATA ORDINE: 26/10/2026     CONSEGNA RICHIESTA: 15/11/2026
CONDIZIONI DI PAGAMENTO: BONIFICO BANCARIO 90 GG FM - BANCA INTESA SANPAOLO
------------------------------------------------------------------------------------------------------------------------------------
RIGA CODICE             DESCRIZIONE FORNITURA                          UM       Q.TA     PREZZO EUR     TOTALE EUR
------------------------------------------------------------------------------------------------------------------------------------
1    RAW-TRAF-25MM      TONDO TRAFILATO FE360 DIAMETRO 25MM X 6000MM   BARRE     50.00        24.00        1200.00
2    RAW-BAR-PIAT50     BARRA PIATTA TRAFILATA 50X10MM L=4000MM        BARRE     30.00        18.50         555.00
3    RAW-LAM-DECAP      LAMIERA DECAPATA 3000X1500 SPESSORE 3MM        LASTRE    10.00       115.00        1150.00
------------------------------------------------------------------------------------------------------------------------------------
TOTALE ORDINE IMPONIBILE: EUR 2.905,00 + IVA 22%
BARCODE ORDINE: *ORD202611029*`;

export const SAMPLE_JSON_DATA = {
  documento: {
    tipo: "FATTURA ACCOMPAGNATORIA",
    numero: "FA-2026/008492",
    data: "24/10/2026",
    valuta: "EUR",
    mittente: {
      ragioneSociale: "ACCIAIERIE & METALLI ITALIA S.P.A.",
      indirizzo: "VIA DELL'INDUSTRIA 45 - 20100 MILANO (MI)",
      partitaIva: "IT03948572019",
      codiceFiscale: "03948572019",
      telefono: "+39 02 8892110",
      email: "amministrazione@acciaierieitalia.it"
    },
    destinatario: {
      codiceCliente: "C004829",
      ragioneSociale: "BEMA LOGISTICS & TRANSPORT S.R.L.",
      indirizzo: "VIA E. MATTEI, 18",
      capCittaProv: "24040 STEZZANO (BG) - ITALIA",
      partitaIva: "IT08472910963",
      codiceSdi: "M5UXCR1",
      destinazioneMerci: "BEMA HUB LOGISTICO NORD - STRADA PROVINCIALE 12 KM 4.2 - 24044 DALMINE (BG)"
    },
    trasporto: {
      vettore: "BRT CORRIERE ESPRESSO",
      porto: "FRANCO",
      colli: 4,
      pesoLordoKg: 420.50,
      pesoNettoKg: 395.00,
      causale: "VENDITA DIRETTA",
      barcode: "FA2026008492C004829"
    },
    pagamento: {
      condizioni: "RIBA 60 GG D.F. FINE MESE",
      scadenza: "31/12/2026",
      banca: "INTESA SANPAOLO",
      iban: "IT60X0306909606100000012345"
    },
    righe: [
      { codice: "PR-LAM-INOX304", descrizione: "LAMIERA ACCIAIO INOX AISI 304 2000X1000 SP.2MM", um: "NR", qta: 15.00, prezzo: 84.50, sconto: 5, totale: 1204.12, iva: 22 },
      { codice: "PR-TUB-QUAD40", descrizione: "TUBOLARE QUADRO 40X40X2 INOX 6MT LUCIDATO", um: "MT", qta: 48.00, prezzo: 12.80, sconto: 0, totale: 614.40, iva: 22 },
      { codice: "PR-VITI-M8X30", descrizione: "KIT BULLONI + DADI AUTOBLOCCANTI M8X30 INOX A2", um: "CF", qta: 10.00, prezzo: 18.50, sconto: 10, totale: 166.50, iva: 22 },
      { codice: "PR-RACC-90G", descrizione: "RACCORDO A GOMITO 90 GRADI A SALDARE DN50 PN16", um: "NR", qta: 24.00, prezzo: 9.20, sconto: 0, totale: 220.80, iva: 22 },
      { codice: "PR-TRASF-SPEZ", descrizione: "LAVORAZIONE SPECIALE TAGLIO LASER SU MISURA", um: "ORE", qta: 4.50, prezzo: 65.00, sconto: 0, totale: 292.50, iva: 22 },
      { codice: "PR-IMB-PALLET", descrizione: "PALLET IN LEGNO TRATTATO HT ISPM-15 120X80", um: "NR", qta: 2.00, prezzo: 15.00, sconto: 0, totale: 30.00, iva: 22 }
    ],
    totali: {
      totaleMerce: 2528.32,
      speseTrasporto: 0.00,
      totaleImponibile: 2528.32,
      totaleIva: 556.23,
      totaleDocumento: 3084.55
    }
  }
};
