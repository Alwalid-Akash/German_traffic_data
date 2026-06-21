# Required Questions Through AccidentInfoAPI

The required answers are produced by the API, not by a separate answer SQL file.
No answer values are hardcoded in the frontend.

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

## Example Calls

```text
GET /accidentinfoapi/answers/earliest-accident-year
GET /accidentinfoapi/answers/count?year=2023&stateAgs=14&personalInjury=true
GET /accidentinfoapi/answers/available-from?stateAgs=05
GET /accidentinfoapi/answers/available-from?stateAgs=13
GET /accidentinfoapi/answers/count?year=2023&stateAgs=11&pedestrian=true
GET /accidentinfoapi/answers/passenger-car-rate?year=2023&limit=5
GET /accidentinfoapi/answers/top-fatal-districts?year=2024&limit=5
GET /accidentinfoapi/answers/count?year=2024&regionName=Dresden&bicycle=true
GET /accidentinfoapi/answers/zero-accident-municipalities?stateAgs=14&year=2023
```

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
