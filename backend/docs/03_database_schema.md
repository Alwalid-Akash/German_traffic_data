# Database Schema and Relationships

## Design Goal

The database stores a canonical model, not one table per raw file.

Main separation:

- `regions`: official administrative geography.
- `accidents`: event-level Unfallatlas records.
- `indicators`: statistical measure definitions.
- `indicator_values`: yearly/monthly statistical values.
- `import_runs` and `source_files`: provenance and reproducibility.

## Entity Relationship Diagram

```mermaid
erDiagram
  import_runs ||--o{ source_files : records
  import_runs ||--o{ accidents : loads
  import_runs ||--o{ indicator_values : loads

  source_files ||--o{ accidents : produced
  source_files ||--o{ indicator_values : produced
  source_files ||--o{ regions : produced

  regions ||--o{ regions : parent_of
  regions ||--o{ accidents : contains
  regions ||--o{ indicator_values : has

  indicators ||--o{ indicator_values : defines

  import_runs {
    int import_run_id PK
    timestamp started_at
    timestamp finished_at
    varchar status
    text notes
  }

  source_files {
    int source_file_id PK
    int import_run_id FK
    varchar source_system
    text source_url
    text file_path
    text file_name
    varchar dataset_code
    int dataset_year
    text sha256
  }

  regions {
    int region_id PK
    varchar ags UK
    text name
    varchar level
    int parent_region_id FK
    text geometry
    int population
    int source_file_id FK
  }

  accidents {
    bigint accident_id PK
    text source_accident_key UK
    int year
    int month
    int hour
    int weekday
    varchar category
    varchar type
    varchar light_conditions
    boolean is_personal_injury
    boolean is_fatal
    boolean is_pedestrian
    boolean is_bicycle
    numeric longitude
    numeric latitude
    int region_id FK
    int source_file_id FK
    int import_run_id FK
  }

  indicators {
    int indicator_id PK
    varchar code UK
    text name
    varchar unit
    varchar source_system
  }

  indicator_values {
    bigint indicator_value_id PK
    int region_id FK
    int indicator_id FK
    int year
    int month
    numeric value
    int source_file_id FK
    int import_run_id FK
  }
```

## Primary Keys

| Table | Primary key |
| --- | --- |
| `import_runs` | `import_run_id` |
| `source_files` | `source_file_id` |
| `regions` | `region_id` |
| `accidents` | `accident_id` |
| `indicators` | `indicator_id` |
| `indicator_values` | `indicator_value_id` |

## Important Unique Keys

| Table | Unique key | Purpose |
| --- | --- | --- |
| `regions` | `ags` | official regional join key |
| `accidents` | `source_accident_key` | duplicate prevention |
| `indicators` | `code` | stable ETL/query indicator reference |
| `indicator_values` | `(region_id, indicator_id, year, month)` | one value per measure/region/time |

## Foreign Keys

| From | To | Meaning |
| --- | --- | --- |
| `regions.parent_region_id` | `regions.region_id` | hierarchy |
| `accidents.region_id` | `regions.region_id` | accident location |
| `indicator_values.region_id` | `regions.region_id` | statistical value location |
| `indicator_values.indicator_id` | `indicators.indicator_id` | value definition |
| `accidents.source_file_id` | `source_files.source_file_id` | provenance |
| `indicator_values.import_run_id` | `import_runs.import_run_id` | ETL run provenance |

## Why This Is Normalized

Raw source files have different schemas and different levels of aggregation. The database resolves that by using:

- one region dimension for all sources.
- one accident fact table for event data.
- one indicator definition/value pair for all statistical measures.
- separate provenance tables.

This supports analytics without depending on raw files at runtime.
