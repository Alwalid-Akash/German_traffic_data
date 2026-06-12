# Required Questions Through AccidentInfoAPI

The required answers are produced by the API, not by a separate answer SQL file.
No answer values are hardcoded in the frontend.

## Main Endpoint

Use this endpoint to answer all required demo questions at once:

```text
GET /accidentinfoapi/answers/required-summary
```

All important defaults can be changed with query parameters:

| Parameter | Default | Meaning |
| --- | --- | --- |
| `personalInjuryYear` | `2023` | year for personal injury count |
| `personalInjuryState` | `14` | state AGS for personal injury count |
| `firstState` | `05` | state AGS for first availability question |
| `secondState` | `13` | state AGS for second availability question |
| `pedestrianYear` | `2023` | year for pedestrian count |
| `pedestrianState` | `11` | state AGS for pedestrian count |
| `rateYear` | `2023` | accident year for passenger-car rate |
| `fatalYear` | `2024` | year for fatal ranking |
| `bicycleYear` | `2024` | year for bicycle count |
| `bicycleRegion` | `Dresden` | region name for bicycle count |
| `zeroYear` | `2023` | year for zero-case analysis |
| `zeroState` | `14` | state AGS for zero-case analysis |

## Individual Endpoints

| Question | Endpoint | Tables |
| --- | --- | --- |
| Earliest accident year | `/answers/earliest-accident-year` | `accidents` |
| Personal injury accidents by state/year | `/answers/count` | `accidents`, `regions` |
| Availability by state | `/answers/available-from` | `accidents`, `regions` |
| Pedestrian accidents by state/year | `/answers/count` | `accidents`, `regions` |
| Passenger-car rate | `/answers/passenger-car-rate` | `accidents`, `regions`, `indicators`, `indicator_values` |
| Top fatal districts | `/answers/top-fatal-districts` | `accidents`, `regions` |
| Bicycle accidents by region/year | `/answers/count` | `accidents`, `regions` |
| Zero-accident municipalities | `/answers/zero-accident-municipalities` | `regions`, `accidents` |

## Dropdown Metadata

The frontend gets available menu options from:

```text
GET /accidentinfoapi/metadata/options
```

This returns years, months, weekdays, hours, categories, accident types, federal states, and regions from the database.

## Justification

- Counts use Unfallatlas accident events in `accidents`.
- Region filters use official AGS values from GV-ISys in `regions`.
- The zero-case question starts from all GV-ISys municipalities and left joins accidents, so municipalities with no accidents can be found.
- The passenger-car rate is a cross-source question because it combines Unfallatlas accident counts with Regionalatlas passenger-car stock from `indicator_values`.
- The API exposes source years in cross-source results, for example `accident_year` and `passenger_car_year`, because official sources may use different reporting periods.

