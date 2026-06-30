# DataScope AI — Dataset Intelligence Platform

## Complete Project Documentation

---

# 1. Problem Statement

Data is the foundation of every machine learning model, analytics pipeline, and research study. Yet the process of understanding, organizing, and preparing datasets before any meaningful work begins is one of the most fragmented and time-consuming parts of the data workflow.

The following challenges are pervasive across teams, organizations, and individual practitioners:

### 1.1 Poor Dataset Organization

Datasets are stored across local drives, cloud storage, email attachments, and messaging platforms without a unified structure. There is no single source of truth. File names are inconsistent, folder hierarchies are flat or chaotic, and locating the right version of a dataset requires tribal knowledge or memory.

### 1.2 Missing Documentation

Most datasets lack accompanying documentation. Column descriptions, data dictionaries, collection methodology, known biases, and transformation history are either missing entirely or scattered across chat logs, notebooks, and verbal conversations. When a new team member joins or a researcher returns to a project after months, understanding the dataset becomes a forensic exercise.

### 1.3 Repeated Preprocessing Work

Without a record of what preprocessing steps were applied to a given dataset, practitioners routinely duplicate effort. The same missing value imputation, outlier removal, encoding, and normalization steps are performed independently by different people on the same raw data. This wastes hours of engineering time and introduces inconsistency in downstream results.

### 1.4 Unknown Data Quality

Before building a model or running an analysis, there is rarely a structured way to assess the quality of a dataset. Missing values, duplicate rows, constant columns, skewed distributions, and data type mismatches often go undetected until they cause model failures, biased results, or misleading visualizations.

### 1.5 Difficulty Identifying Target Variables

In supervised learning workflows, selecting the correct target variable is critical. Many datasets arrive without clear labeling of which column is the target, what the class distribution looks like, or whether the target has significant missingness. This leads to misconfigured experiments and wasted compute.

### 1.6 Duplicate Datasets

Without centralized storage and metadata tracking, the same dataset is often uploaded, copied, and modified independently by multiple users. This creates a sprawl of near-duplicate files with no clear lineage, making it impossible to determine which version is authoritative.

### 1.7 Inconsistent Schemas

When multiple datasets are used across a project or organization, schema inconsistencies — different column names for the same concept, different data types for the same field, different encodings for categorical values — create integration nightmares and silent data corruption.

### 1.8 Time Wasted Understanding Old Datasets

Revisiting a dataset after weeks or months requires re-exploring its structure, distributions, and quirks. Without saved profiles, summaries, or notes, practitioners spend 30–60% of their time re-discovering what they already knew about the data.

### 1.9 Lack of Centralized Dataset Management

There is no widely adopted, lightweight platform that serves as a central hub for dataset storage, profiling, documentation, and discovery — especially one designed for individual practitioners, small teams, and students who do not have the infrastructure for enterprise data catalogs.

### 1.10 Limited Insight into Dataset Health Before Modeling

Existing tools focus on model performance metrics after training. There is a gap in the workflow: no standardized, automated way to evaluate whether a dataset is even suitable for modeling before committing time and compute resources.

---

# 2. Objectives

## 2.1 Functional Objectives

These define what the platform must do from the user's perspective.

| # | Objective | Description |
|---|-----------|-------------|
| F1 | Upload Datasets | Accept CSV and Excel files (.csv, .xlsx, .xls) through a drag-and-drop or file picker interface. Validate file format, size, and encoding before ingestion. |
| F2 | Store Datasets | Persist uploaded datasets with metadata (name, description, upload date, row count, column count, file size, tags) in a structured database. Associate datasets with authenticated users. |
| F3 | Analyze Datasets | Automatically generate a comprehensive profile of each uploaded dataset upon ingestion, including data types, statistics, missing value percentages, unique value counts, and distribution summaries for every column. |
| F4 | Visualize Statistics | Render interactive charts for column distributions (histograms, bar charts, box plots), correlation heatmaps, missing value matrices, and data type breakdowns directly in the browser. |
| F5 | Detect Missing Values | Identify, quantify, and visualize missing values at the column level and row level. Flag columns with missingness above configurable thresholds. |
| F6 | Generate Reports | Produce downloadable PDF or HTML reports containing the full dataset profile, quality score, visualizations, and recommendations. Reports should be shareable and self-contained. |
| F7 | Manage Metadata | Allow users to add, edit, and search metadata fields including dataset name, description, tags, source, collection date, and custom notes. Support structured and free-text metadata. |
| F8 | Search Datasets | Provide full-text search across dataset names, descriptions, tags, column names, and metadata fields. Enable filtering by upload date, quality score, row count, and data types. |
| F9 | Compare Datasets | Enable side-by-side comparison of two datasets showing schema differences, column-by-column statistical divergence, and structural changes. Highlight additions, removals, and modifications. |
| F10 | Maintain Dataset History | Track and display the version history of a dataset including upload timestamps, metadata changes, and profile snapshots. Allow users to view previous profiles without re-uploading. |

## 2.2 Technical Objectives

These define the system-level goals that govern architecture and implementation.

| # | Objective | Description |
|---|-----------|-------------|
| T1 | Scalable Architecture | Design the system with clear separation of concerns (frontend, API layer, processing layer, data layer) so that each component can be scaled independently. Use asynchronous processing for dataset analysis to avoid blocking user interactions. |
| T2 | Modular Backend | Structure the backend as a collection of isolated, well-defined modules (authentication, file management, profiling engine, report generator, metadata service) with clear interfaces. Each module should be testable and replaceable. |
| T3 | Efficient Processing | Optimize dataset profiling for speed and memory. Use chunked reading for large files, vectorized operations for statistics computation, and streaming for file uploads. Target profiling of a 100K-row, 50-column dataset in under 10 seconds. |
| T4 | Secure Authentication | Implement JWT-based authentication with bcrypt password hashing. Protect all dataset endpoints behind authentication. Validate and sanitize all file uploads to prevent injection attacks and malicious file execution. |
| T5 | Responsive UI | Build a fully responsive interface that works on desktop (1920px+), laptop (1366px+), tablet (768px+), and mobile (375px+). Use Tailwind CSS for consistent, utility-first styling. |
| T6 | Fast Analysis | Minimize time-to-insight. Begin displaying partial profiling results as they are computed rather than waiting for the entire analysis to complete. Use background job queues for report generation. |
| T7 | Reusable APIs | Design RESTful APIs with consistent request/response schemas, proper HTTP status codes, pagination, and error handling. Document all endpoints with OpenAPI/Swagger specifications. |
| T8 | Clean Database Design | Normalize relational data (users, datasets, metadata, profiles, versions) with proper foreign keys, indexes, and constraints. Use appropriate data types and avoid storing derived data that can be computed on read. |

## 2.3 Learning Objectives

This project is designed as a comprehensive learning experience. The following areas are deeply explored through its implementation.

| # | Area | What This Project Teaches |
|---|------|---------------------------|
| L1 | Data Engineering | Building file ingestion pipelines, parsing multiple formats (CSV, Excel), handling encoding issues, managing file storage, and designing schemas for structured metadata. |
| L2 | Data Analytics | Computing descriptive statistics (mean, median, mode, standard deviation, skewness, kurtosis, percentiles), identifying distributions, and summarizing multi-dimensional data. |
| L3 | Data Profiling | Implementing automated profiling logic: type detection, cardinality analysis, pattern recognition, missing value analysis, constant column detection, and data quality scoring algorithms. |
| L4 | Backend Development | Building RESTful APIs with authentication, authorization, file handling, background job processing, error handling, input validation, and structured logging. |
| L5 | API Development | Designing versioned, documented, and tested API endpoints with consistent schemas, proper HTTP semantics, pagination, filtering, and rate limiting. |
| L6 | Database Design | Modeling relational data with users, datasets, columns, profiles, versions, and metadata tables. Implementing migrations, indexes, and query optimization. |
| L7 | Frontend Development | Building a modern, responsive, animated single-page application with form handling, file upload with progress tracking, data tables, search, and client-side routing. |
| L8 | Visualization | Rendering interactive charts (histograms, bar charts, box plots, heatmaps, pie charts) using charting libraries. Handling dynamic data binding, responsive sizing, and tooltips. |
| L9 | Software Architecture | Designing a full-stack application with clear layer separation, environment configuration, dependency management, error boundaries, and deployment considerations. |

---

# 3. Scope

## 3.1 In Scope — Version 1

The following features and capabilities are included in the initial release of DataScope AI.

### 3.1.1 User Authentication and Account Management

- User registration with email and password.
- User login with JWT-based session management.
- Password hashing with bcrypt.
- Protected routes and API endpoints.
- User profile page with account settings.
- Password reset via email (basic flow).

### 3.1.2 Dataset Upload and Storage

- File upload via drag-and-drop interface and native file picker.
- Supported formats: CSV (.csv), Excel (.xlsx, .xls).
- Maximum file size: 100MB per upload.
- Automatic file validation (format, encoding, structure).
- Metadata extraction on upload (row count, column count, file size, detected encoding).
- User-defined metadata entry (name, description, tags) at upload time.
- Persistent storage of raw files and parsed metadata in the database.
- Upload progress bar with real-time feedback.

### 3.1.3 Automated Dataset Profiling

- Automatic profiling triggered on every upload.
- Per-column analysis:
  - Data type detection (numeric, categorical, datetime, boolean, text).
  - Count of non-null values.
  - Count and percentage of missing values.
  - Count of unique values (cardinality).
  - Mean, median, mode, standard deviation, min, max, 25th/50th/75th percentiles for numeric columns.
  - Top 10 most frequent values for categorical columns.
  - Min/max length, average length for text columns.
  - Date range for datetime columns.
- Row-level analysis:
  - Total row count.
  - Count of completely empty rows.
  - Count of duplicate rows.
- Dataset-level analysis:
  - Overall data quality score (0–100) computed from missingness, duplication, and type consistency.
  - Column type breakdown summary.
  - Memory usage estimate.

### 3.1.4 Missing Value Analysis

- Column-level missing value counts and percentages.
- Visual missing value matrix (heatmap showing missingness pattern across rows and columns).
- Missing value correlation (which columns tend to be missing together).
- Flag columns exceeding user-configurable missingness thresholds.

### 3.1.5 Correlation Analysis

- Pearson correlation matrix for all numeric columns.
- Interactive heatmap visualization of the correlation matrix.
- Identification of highly correlated column pairs (|r| > 0.8).
- Spearman rank correlation as an alternative for non-linear relationships.

### 3.1.6 Interactive Visualizations

- Histograms for numeric column distributions.
- Bar charts for categorical column value frequencies.
- Box plots for numeric columns showing quartiles and outliers.
- Pie charts for categorical columns with low cardinality.
- Scatter plots for selected column pairs.
- Missing value bar chart (percentage per column).
- Data type distribution pie chart.
- All charts are interactive (hover tooltips, zoom, click-to-filter).

### 3.1.7 Data Quality Scoring

- Automated quality score computation based on:
  - Percentage of missing values across all cells.
  - Percentage of duplicate rows.
  - Percentage of columns with consistent data types.
  - Percentage of columns with high cardinality (potential identifier columns).
- Quality score displayed prominently on dataset cards and profile pages.
- Quality breakdown showing individual factor contributions.

### 3.1.8 Report Generation

- One-click PDF report generation from the dataset profile.
- Report includes:
  - Dataset overview (name, description, upload date, dimensions).
  - Column-by-column statistics table.
  - Key visualizations (distributions, missing values, correlations).
  - Data quality score and breakdown.
  - Recommendations for data cleaning.
- Reports stored server-side and available for download.
- Background processing to avoid blocking the UI.

### 3.1.9 Dataset Search and Filtering

- Full-text search across dataset names, descriptions, tags, and column names.
- Filter datasets by upload date range, quality score range, row count, and tags.
- Sort results by relevance, date, name, or quality score.
- Paginated results with configurable page size.

### 3.1.10 Dataset Comparison

- Select two datasets for side-by-side comparison.
- Schema comparison: columns present in one but not the other, type mismatches.
- Statistical comparison: mean, median, distribution shape differences for shared numeric columns.
- Visual diff showing additions, removals, and changes.

### 3.1.11 Dataset Version History

- Automatic version creation on each upload or re-upload of the same dataset.
- Version list showing upload timestamps, file sizes, and row/column counts.
- Ability to view the profile of any previous version.
- No automatic version merging — versions are snapshots.

### 3.1.12 Responsive Dashboard

- Central dashboard showing all user datasets as cards.
- Each card displays: name, description, tags, upload date, dimensions, quality score.
- Quick actions: view profile, download report, compare, delete.
- Grid/list view toggle.

### 3.1.13 Metadata Management

- Edit dataset name, description, and tags after upload.
- Add custom key-value metadata fields.
- Metadata is searchable and included in reports.

---

## 3.2 Out of Scope — Version 1

The following features are intentionally excluded from Version 1. Each exclusion includes a rationale.

### 3.2.1 AI-Generated Insights

**What it would involve:** Using LLMs or statistical models to automatically generate natural-language summaries of dataset characteristics, anomalies, and recommendations.

**Why excluded:** While valuable, this introduces dependency on external AI APIs, increases cost per analysis, and requires careful prompt engineering and validation. It is planned for Version 2 with a dedicated insights engine.

### 3.2.2 Automatic Preprocessing Suggestions

**What it would involve:** Recommending specific preprocessing steps (imputation strategies, encoding methods, outlier handling) based on the dataset profile.

**Why excluded:** Reliable preprocessing recommendations require domain context and modeling objectives that are not available at the profiling stage. Incorrect suggestions could lead users astray. This will be addressed in a future "Data Preparation Assistant" module.

### 3.2.3 Feature Engineering Recommendations

**What it would involve:** Suggesting new features that could be derived from existing columns (interaction terms, polynomial features, date decompositions, text embeddings).

**Why excluded:** Feature engineering is tightly coupled with the modeling task and domain knowledge. Generic recommendations without task context would be noise. This is planned as part of an ML-assisted pipeline in Version 3.

### 3.2.4 Dataset Version Comparison (Diff)

**What it would involve:** Deep row-level and cell-level diffing between dataset versions to identify exactly what changed between uploads.

**Why excluded:** While basic version history is included, deep diffing of large datasets is computationally expensive and requires specialized algorithms. Version 1 provides snapshot viewing; diffing is deferred to Version 2.

### 3.2.5 Data Lineage

**What it would involve:** Tracking the full provenance chain of a dataset — where it was sourced, what transformations were applied, and which models or reports consumed it.

**Why excluded:** Lineage requires a graph-based data model, event sourcing infrastructure, and integration with external processing tools. This is a Version 3 feature that depends on the platform becoming a central part of user workflows.

### 3.2.6 ML Model Training

**What it would involve:** Allowing users to train machine learning models directly on uploaded datasets within the platform.

**Why excluded:** Model training introduces massive computational requirements, GPU infrastructure, experiment tracking, and hyperparameter management — all of which are outside the scope of a dataset intelligence platform. DataScope AI focuses on understanding data, not training models.

### 3.2.7 AutoML

**What it would involve:** Automatically selecting algorithms, tuning hyperparameters, and evaluating model performance on uploaded datasets.

**Why excluded:** AutoML platforms (Auto-sklearn, TPOT, H2O) already exist. DataScope AI's value is in the pre-modeling phase. Adding AutoML would dilute the product focus and introduce significant infrastructure complexity.

### 3.2.8 Distributed Processing

**What it would involve:** Using Spark, Dask, or similar frameworks to process datasets that exceed single-machine memory.

**Why excluded:** Version 1 targets datasets up to 100MB, which can be processed efficiently on a single machine. Distributed infrastructure adds operational complexity and cost that is not justified for the initial user base.

### 3.2.9 Real-Time Streaming

**What it would involve:** Accepting streaming data (Kafka, WebSocket) and providing continuous profiling updates.

**Why excluded:** The platform's workflow is batch-oriented: upload a file, get a profile. Real-time streaming is a fundamentally different paradigm that requires a separate ingestion engine. It is a potential Version 4 feature.

### 3.2.10 Team Collaboration

**What it would involve:** Multi-user workspaces, shared dataset libraries, role-based access control within teams, comments on datasets, and collaborative annotations.

**Why excluded:** Version 1 is designed for individual users. Collaboration features require workspace management, permissions systems, notification infrastructure, and real-time synchronization. This is planned for Version 2 as a premium feature.

### 3.2.11 Cloud Notebooks

**What it would involve:** Embedded Jupyter-like notebooks for exploratory data analysis directly within the platform.

**Why excluded:** Notebook infrastructure (JupyterLab, VS Code Server) is complex to secure, sandbox, and scale. Users can download datasets and profiles to use in their local notebooks. This is a long-term roadmap item.

### 3.2.12 Kaggle Synchronization

**What it would involve:** Two-way sync with Kaggle datasets — importing datasets from Kaggle and pushing profiles back as dataset metadata.

**Why excluded:** Kaggle API integration requires OAuth setup, rate limit management, and mapping between Kaggle's metadata model and DataScope AI's model. This is a convenience feature scheduled for Version 2.

### 3.2.13 Cloud Storage Integration

**What it would involve:** Connecting to AWS S3, Google Cloud Storage, Azure Blob, or Dropbox to import/export datasets directly.

**Why excluded:** Cloud storage integration requires per-provider SDK setup, credential management, and storage abstraction layers. Version 1 uses local file upload. Cloud integration is planned for Version 2 with a storage abstraction module.

### 3.2.14 Dataset Recommendation Engine

**What it would involve:** Suggesting related datasets, supplementary data sources, or alternative datasets based on the user's uploaded data and profile.

**Why excluded:** Recommendations require a dataset graph, similarity metrics across the entire dataset corpus, and user behavior tracking. This is a Version 3 feature that benefits from a large user base and dataset catalog.

### 3.2.15 Annotation Tools

**What it would involve:** In-platform tools for labeling data, adding row-level annotations, and creating labeled datasets for supervised learning.

**Why excluded:** Annotation is a specialized workflow (cf. Label Studio, Prodigy) with its own UX patterns, quality assurance mechanisms, and inter-annotator agreement logic. It is outside the scope of dataset profiling.

---

# 4. Target Users

## 4.1 Students

### Goals
- Understand the structure and quality of datasets used in coursework and projects.
- Learn data profiling concepts through hands-on exploration.
- Generate professional reports for academic submissions.
- Quickly assess whether a dataset is suitable for a class assignment or thesis project.

### Technical Knowledge
- Beginner to intermediate. Familiar with CSV files and basic spreadsheet operations. May have limited experience with pandas, profiling libraries, or command-line tools.

### Expected Workflows
1. Download a dataset from Kaggle, UCI ML Repository, or course materials.
2. Upload the dataset to DataScope AI.
3. Review the automated profile to understand column types, distributions, and missing values.
4. Use visualizations to identify patterns and anomalies.
5. Download the profile report to include in an assignment or presentation.
6. Iterate: clean the dataset locally, re-upload, and compare quality scores.

### Permissions
- Upload datasets (up to 10 concurrent datasets on free tier).
- View profiles and visualizations.
- Download reports.
- Search and filter own datasets.
- No access to other users' datasets.

### Challenges
- Limited time to manually explore datasets.
- Lack of experience with profiling tools (pandas-profiling, ydata-profiling).
- Need for visual, interpretable summaries rather than raw statistical output.
- Academic deadlines requiring fast turnaround.

---

## 4.2 ML Engineers

### Goals
- Rapidly assess dataset quality before committing to feature engineering and model training.
- Identify data quality issues (missing values, duplicates, type inconsistencies) early in the pipeline.
- Maintain a catalog of datasets used across experiments.
- Compare dataset versions to understand how preprocessing changed the data.

### Technical Knowledge
- Advanced. Proficient in Python, pandas, scikit-learn, and ML pipelines. Comfortable with CLI tools, APIs, and automation.

### Expected Workflows
1. Receive a dataset from a data provider or internal team.
2. Upload to DataScope AI for a quick quality assessment.
3. Review the quality score and missing value analysis to decide if preprocessing is needed.
4. Use correlation analysis to identify multicollinearity before feature selection.
5. Compare the raw dataset with the cleaned version to document changes.
6. Reference the dataset profile in experiment tracking (MLflow, W&B).

### Permissions
- Full CRUD on own datasets.
- API access for programmatic upload and profile retrieval.
- Dataset comparison between any two owned datasets.
- Version history access.

### Challenges
- Datasets arriving from external sources with no documentation.
- Spending hours on EDA before determining a dataset is unusable.
- Lack of a standardized quality baseline across experiments.
- Difficulty communicating data quality issues to non-technical stakeholders.

---

## 4.3 Data Scientists

### Goals
- Perform exploratory data analysis (EDA) efficiently without writing boilerplate code.
- Generate shareable, visual dataset profiles for stakeholder communication.
- Identify target variable characteristics (distribution, missingness, class imbalance).
- Maintain a personal library of profiled datasets.

### Technical Knowledge
- Intermediate to advanced. Comfortable with Python, R, SQL, and visualization libraries. May prefer GUI tools for initial exploration before coding.

### Expected Workflows
1. Acquire a new dataset for a business problem.
2. Upload to DataScope AI and review the automated profile.
3. Examine the target column's distribution, missingness, and cardinality.
4. Use the correlation heatmap to identify potential feature relationships.
5. Generate a PDF report to share with business stakeholders.
6. Use the platform's API to integrate profiling into a Jupyter notebook workflow.

### Permissions
- Full CRUD on own datasets.
- Report generation and download.
- Dataset search across own catalog.
- API access for integration with notebooks and scripts.

### Challenges
- Balancing depth of analysis with time constraints.
- Communicating data quality findings to non-technical audiences.
- Repeatedly writing profiling code for each new dataset.
- Managing dozens of datasets across multiple projects.

---

## 4.4 Researchers

### Goals
- Document dataset characteristics for reproducibility in published research.
- Compare datasets used in different studies or experiments.
- Maintain metadata and provenance information for research datasets.
- Generate publication-ready statistical summaries.

### Technical Knowledge
- Variable. Some researchers are highly technical (computational sciences); others work primarily in GUI tools (social sciences, humanities). The platform must be accessible to both.

### Expected Workflows
1. Collect or receive a research dataset.
2. Upload to DataScope AI and add detailed metadata (source, collection methodology, ethics approval number).
3. Review the profile to understand the dataset's characteristics before analysis.
4. Download the profile report to include as a supplementary material in a paper.
5. Compare the dataset with a publicly available benchmark dataset to discuss differences.
6. Revisit the dataset profile months later when revising the paper.

### Permissions
- Full CRUD on own datasets.
- Rich metadata editing (custom fields, long descriptions).
- Report generation with customizable templates.
- Dataset comparison.

### Challenges
- Reproducibility requirements demanding thorough dataset documentation.
- Long project timelines (months to years) requiring persistent dataset storage.
- Collaboration with co-researchers who may have different technical backgrounds.
- Meeting journal requirements for data availability statements.

---

## 4.5 Analysts

### Goals
- Quickly understand the shape and quality of business datasets (sales, marketing, operations).
- Identify data quality issues that could affect dashboard accuracy or report validity.
- Generate executive-friendly summaries of dataset health.
- Track how data quality changes over time as new data is ingested.

### Technical Knowledge
- Beginner to intermediate. Strong in SQL and Excel. May have limited programming experience. Values intuitive UI and one-click actions.

### Expected Workflows
1. Export a dataset from a BI tool, CRM, or data warehouse.
2. Upload the CSV/Excel file to DataScope AI.
3. Review the dashboard for immediate quality indicators.
4. Check for missing values and duplicates that could skew KPIs.
5. Download a report to share with the data engineering team or management.
6. Re-upload updated datasets monthly to track quality trends.

### Permissions
- Upload and profile datasets.
- View visualizations and quality scores.
- Download reports.
- Search own datasets.

### Challenges
- Inheriting datasets with no documentation from previous team members.
- Trusting dashboard numbers without understanding the underlying data quality.
- Limited ability to write profiling code.
- Need for fast, visual, non-technical summaries.

---

## 4.6 Educators

### Goals
- Teach data literacy, profiling, and quality assessment concepts using a practical tool.
- Provide students with a platform for hands-on dataset exploration.
- Create shared dataset libraries for course use.
- Assess student work through submitted profile reports.

### Technical Knowledge
- Intermediate. Strong domain knowledge in data science or statistics. May use the platform primarily as a teaching aid rather than for personal analysis.

### Expected Workflows
1. Curate a collection of datasets for a course module on data quality.
2. Upload datasets to DataScope AI and add educational metadata.
3. Demonstrate profiling concepts in class using the platform's visualizations.
4. Assign students to upload a dataset, generate a profile, and submit the report.
5. Review student-submitted reports to assess understanding.

### Permissions
- Upload and manage datasets.
- Share datasets with students via link (read-only access to profiles).
- Generate and download reports.
- View usage analytics for shared datasets (how many students accessed it).

### Challenges
- Finding diverse, well-documented teaching datasets.
- Demonstrating abstract profiling concepts in a tangible way.
- Assessing student understanding of data quality beyond surface-level metrics.
- Managing datasets across multiple course sections and semesters.

---

# 5. User Personas

## Persona 1: Priya Sharma

| Field | Details |
|-------|---------|
| **Name** | Priya Sharma |
| **Age** | 21 |
| **Profession** | Computer Science undergraduate (3rd year) |
| **Location** | Bangalore, India |
| **Goals** | Complete her machine learning course project with a good grade. Understand the Kaggle dataset she downloaded for her assignment. Generate a professional EDA report to submit with her project. |
| **Pain Points** | She has limited experience with pandas-profiling and finds the output overwhelming. She doesn't know how to interpret correlation matrices. She spent 3 hours trying to figure out why her model was performing poorly, only to discover the target column had 40% missing values. Her professor requires a written data quality assessment, but she doesn't know where to start. |
| **Platform Usage** | Uploads 2–3 datasets per semester. Uses the platform primarily for automated profiling and report generation. Relies heavily on visualizations to understand distributions. Downloads PDF reports for assignment submissions. |
| **Expected Benefits** | Save 5+ hours per assignment on EDA. Produce higher-quality reports with professional visualizations. Identify data quality issues before they affect model performance. Build intuition for data profiling that she can apply in future projects. |

---

## Persona 2: Marcus Chen

| Field | Details |
|-------|---------|
| **Name** | Marcus Chen |
| **Age** | 29 |
| **Profession** | ML Engineer at a mid-size fintech startup |
| **Location** | Toronto, Canada |
| **Goals** | Standardize data quality assessment across his team's ML pipeline. Quickly triage incoming datasets from external data providers. Reduce the time spent on exploratory data analysis before feature engineering. |
| **Pain Points** | External data providers send CSV files with inconsistent schemas, undocumented columns, and varying quality. He wastes 2–4 hours per dataset on manual inspection. Different team members apply different profiling approaches, leading to inconsistent quality baselines. He needs a lightweight tool that doesn't require setting up infrastructure. |
| **Platform Usage** | Uploads 5–10 datasets per week. Uses the API to integrate profiling into automated pipeline checks. Frequently uses the dataset comparison feature to track schema changes between data deliveries. Maintains a catalog of 50+ profiled datasets. |
| **Expected Benefits** | Reduce dataset triage time from 2 hours to 15 minutes. Establish a team-wide quality baseline with standardized scores. Catch schema drift and quality degradation automatically. Integrate profiling reports into experiment tracking. |

---

## Persona 3: Dr. Elena Vasquez

| Field | Details |
|-------|---------|
| **Name** | Dr. Elena Vasquez |
| **Age** | 42 |
| **Profession** | Associate Professor of Epidemiology |
| **Location** | Madrid, Spain |
| **Goals** | Document the datasets used in her research publications for reproducibility. Teach her graduate students about data quality assessment. Manage multiple research datasets across concurrent projects. |
| **Pain Points** | Journal reviewers increasingly require detailed data availability statements and quality assessments. Her students struggle with command-line profiling tools. She manages 15+ datasets across 3 active research projects and can never find the right version. Her collaborator in another university needs to understand a dataset she collected, but she has no documentation to share. |
| **Platform Usage** | Uploads 3–5 datasets per month. Adds detailed metadata including collection methodology, ethics approval numbers, and variable descriptions. Generates PDF reports for supplementary materials. Shares dataset profiles with collaborators and students. |
| **Expected Benefits** | Meet journal reproducibility requirements with minimal effort. Provide students with a visual, intuitive tool for data exploration. Maintain a well-documented library of research datasets. Share self-explanatory dataset profiles with collaborators. |

---

## Persona 4: James Okafor

| Field | Details |
|-------|---------|
| **Name** | James Okafor |
| **Age** | 35 |
| **Profession** | Senior Data Analyst at a retail chain |
| **Location** | Lagos, Nigeria |
| **Goals** | Validate the quality of datasets before building executive dashboards. Identify data quality issues in monthly sales and inventory extracts. Communicate data quality findings to non-technical business stakeholders. |
| **Pain Points** | He receives monthly CSV exports from the ERP system that sometimes contain duplicates, missing regions, or inconsistent product codes. Dashboard inaccuracies caused by poor data quality have eroded stakeholder trust. He can write basic SQL but is not comfortable with Python profiling libraries. He needs a tool that gives him answers without code. |
| **Platform Usage** | Uploads 4–6 datasets per month (monthly extracts from different business domains). Uses the quality score as a gate — datasets below 70 are flagged for remediation. Downloads reports to present in data governance meetings. Uses search to find previously profiled datasets. |
| **Expected Benefits** | Catch data quality issues before they reach dashboards. Provide quantitative quality metrics to build stakeholder trust. Reduce the time spent on manual data validation from 4 hours to 30 minutes per dataset. Build a historical record of data quality trends. |

---

## Persona 5: Aisha Patel

| Field | Details |
|-------|---------|
| **Name** | Aisha Patel |
| **Age** | 26 |
| **Profession** | Data Scientist at a healthcare analytics company |
| **Location** | London, UK |
| **Goals** | Rapidly profile clinical datasets to assess suitability for predictive modeling. Identify target variable characteristics and class imbalance early. Generate dataset summaries for cross-functional team reviews. |
| **Pain Points** | Clinical datasets are notoriously messy — mixed data types, inconsistent date formats, free-text fields masquerading as categories. She spends the first day of every new project just understanding the data. Her managers want visual summaries, not Jupyter notebooks. She needs to profile 50+ columns quickly without writing custom code for each. |
| **Platform Usage** | Uploads 2–3 datasets per week during active project phases. Uses correlation analysis to identify multicollinearity in clinical features. Generates reports for stakeholder meetings. Compares raw and cleaned datasets to document preprocessing impact. |
| **Expected Benefits** | Reduce EDA time from 1 day to 2 hours per dataset. Generate stakeholder-ready visual reports in minutes. Identify target variable issues (missingness, class imbalance) before committing to modeling. Maintain a profiled dataset catalog across projects. |

---

## Persona 6: Prof. David Kim

| Field | Details |
|-------|---------|
| **Name** | Prof. David Kim |
| **Age** | 50 |
| **Profession** | Lecturer in Data Science (Master's program) |
| **Location** | Seoul, South Korea |
| **Goals** | Teach data quality and profiling concepts with a practical, visual tool. Provide students with a standardized platform for course assignments. Assess student understanding through submitted profile reports. |
| **Pain Points** | Students spend more time fighting with tool installation (ydata-profiling, Sweetviz) than learning profiling concepts. Report quality varies wildly — some students produce polished analyses while others submit raw code output. He needs a uniform platform where every student works with the same interface. He teaches 3 sections of 40 students each and cannot debug everyone's environment. |
| **Platform Usage** | Curates 10–15 datasets per semester for course use. Shares dataset profiles with students via the platform. Assigns students to upload a dataset, generate a profile, and submit the report. Reviews 120 reports per semester. |
| **Expected Benefits** | Eliminate tool installation issues — students use the browser. Standardize report format across all students. Focus class time on interpreting results, not debugging code. Assess student understanding through their interaction with the platform's outputs. |

---

# 6. Core Features

---

## 6.1 Dataset Upload

### Purpose
Provide a fast, reliable, and user-friendly mechanism for users to ingest CSV and Excel files into the platform for analysis.

### Description
The upload feature is the entry point for all platform functionality. It accepts .csv, .xlsx, and .xls files, validates them for format correctness and size limits, extracts structural metadata, and triggers the automated profiling pipeline. The upload interface supports both drag-and-drop and native file picker interactions with real-time progress feedback.

### Workflow
1. User navigates to the dashboard and clicks "Upload Dataset" or drags a file onto the upload zone.
2. Client-side validation checks file extension and size (max 100MB).
3. File is uploaded via multipart form data to the `/api/datasets/upload` endpoint with metadata fields (name, description, tags).
4. Server validates the file:
   - Check MIME type and extension.
   - Verify the file is not empty.
   - Attempt to parse the first 100 rows to confirm valid structure.
   - Check for encoding issues (UTF-8, Latin-1, etc.).
5. If valid, the file is stored in the file system (or object storage), and a dataset record is created in the database.
6. A background profiling job is enqueued.
7. User sees a success notification with a link to the dataset profile page.
8. If invalid, user receives a specific error message indicating the issue.

### Expected UI
- **Upload Zone:** A dashed-border rectangle (400px × 250px) centered on the dashboard. Displays a cloud upload icon and text: "Drag & drop your CSV or Excel file here, or click to browse."
- **Progress State:** The upload zone transitions to a progress bar with percentage, file name, and file size. The background fills with a gradient as upload progresses.
- **Metadata Form:** Below the upload zone (or in a modal), three fields: Name (required, pre-filled with file name), Description (optional textarea), Tags (optional, comma-separated input with tag chips).
- **Success State:** A green checkmark animation with "Upload complete. Profiling in progress..." and a "View Profile" button.
- **Error State:** A red-bordered error card with a specific message (e.g., "File exceeds 100MB limit", "Unable to parse file. Ensure it is a valid CSV or Excel file.").

### Backend Logic
1. **File Reception:** Use `multer` (Node.js) or equivalent middleware to handle multipart uploads with streaming to avoid loading the entire file into memory.
2. **Validation Pipeline:**
   - Extension check: `.csv`, `.xlsx`, `.xls`
   - Size check: ≤ 100MB
   - MIME type check: `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`
   - Parse check: Attempt to read first 100 rows using `papaparse` (CSV) or `xlsx` (Excel)
   - Encoding detection: Use `chardet` or `iconv-lite` to detect and normalize encoding
3. **Storage:** Save the raw file to `/data/uploads/{userId}/{datasetId}/{filename}`
4. **Database Record:** Insert into `datasets` table with: id, userId, name, description, tags, fileName, filePath, fileSize, rowCount, columnCount, mimeType, encoding, status ("uploaded"), createdAt, updatedAt
5. **Job Enqueue:** Add a profiling job to the background queue (Bull/BullMQ with Redis, or a simple in-process queue for v1)

### Validation Rules
| Rule | Condition | Error Message |
|------|-----------|---------------|
| File required | No file provided | "Please select a file to upload." |
| File extension | Must be .csv, .xlsx, or .xls | "Unsupported file format. Please upload a CSV or Excel file." |
| File size | Must be ≤ 100MB | "File exceeds the 100MB size limit." |
| File not empty | File must contain at least 1 row | "The uploaded file is empty." |
| Parseable | File must be parseable | "Unable to read the file. Ensure it is a valid CSV or Excel file with proper formatting." |
| Name required | Name field must not be empty | "Please provide a name for this dataset." |
| Name length | Name must be ≤ 200 characters | "Dataset name must be 200 characters or fewer." |

### Edge Cases
- **Large files (50–100MB):** Use streaming upload and chunked parsing. Do not load the entire file into memory. Show a warning that profiling may take longer for large files.
- **Files with mixed encodings:** Attempt UTF-8 first, fall back to Latin-1. If encoding is ambiguous, warn the user and proceed with the detected encoding.
- **Excel files with multiple sheets:** Parse only the first sheet by default. Display a note: "This file contains multiple sheets. Only the first sheet ('Sheet1') was analyzed." Allow sheet selection in a future version.
- **CSV files with inconsistent columns:** If rows have different numbers of columns, flag the issue but attempt to parse with the most common column count. Report the number of malformed rows.
- **Duplicate uploads:** If a user uploads a file with the same name as an existing dataset, prompt: "A dataset with this name already exists. Do you want to create a new version or rename this upload?"
- **Concurrent uploads:** Allow multiple simultaneous uploads from the same user. Process them in parallel with separate profiling jobs.
- **Network interruption:** Implement resumable uploads for files > 10MB using chunked upload (TUS protocol or custom implementation).

### Success Criteria
- Upload completes in < 5 seconds for files under 10MB on a standard connection.
- File validation rejects 100% of invalid files with specific, actionable error messages.
- Profiling job is enqueued within 1 second of upload completion.
- User can navigate to the dataset profile page immediately after upload, even while profiling is in progress (shows "Profiling in progress..." state).

---

## 6.2 Automated Dataset Profiling

### Purpose
Eliminate manual exploratory data analysis by automatically generating a comprehensive statistical profile of every uploaded dataset, providing instant insight into structure, quality, and characteristics.

### Description
Upon upload, the profiling engine parses the entire dataset and computes column-level statistics, row-level summaries, and dataset-level quality metrics. Results are stored in the database and rendered as an interactive profile page. Profiling runs asynchronously in a background job to avoid blocking the upload flow.

### Workflow
1. Profiling job is dequeued from the background job queue.
2. Dataset file is read in chunks (10,000 rows at a time for CSV, streaming for Excel).
3. Column-level analysis is performed:
   - Data type detection using heuristic rules (numeric if >80% of non-null values parse as numbers; datetime if >80% parse as valid dates; categorical if cardinality < 20% of row count and < 100 unique values; otherwise text).
   - Null count and percentage per column.
   - Unique value count per column.
   - Descriptive statistics for numeric columns (mean, median, mode, std, min, max, 25th/50th/75th percentiles, skewness, kurtosis).
   - Value frequency table for categorical columns (top 10 values with counts and percentages).
   - String length statistics for text columns (min, max, mean length).
   - Date range for datetime columns (earliest, latest, span).
4. Row-level analysis is performed:
   - Total row count.
   - Completely empty row count.
   - Duplicate row count (exact match across all columns).
5. Dataset-level quality score is computed (see Feature 6.7).
6. Results are stored in the `column_profiles` and `dataset_profiles` tables.
7. Dataset status is updated from "profiling" to "profiled".
8. User receives a real-time notification (WebSocket or polling) that profiling is complete.

### Expected UI
- **Profile Page Layout:** Full-page layout with a sticky header showing dataset name, dimensions, quality score, and action buttons (Download Report, Compare, Edit Metadata).
- **Overview Tab:** Summary cards showing total rows, total columns, missing cells (%), duplicate rows, data quality score, memory usage. A data type breakdown pie chart.
- **Columns Tab:** A scrollable list of column cards. Each card shows: column name, detected type, non-null count, missing count/bar, unique values, and a mini visualization (histogram for numeric, bar chart for categorical). Clicking a column card expands it to show full statistics and a larger chart.
- **Missing Values Tab:** A heatmap showing the missing value matrix (columns on x-axis, row bins on y-axis). A bar chart showing missing percentage per column. A table listing columns with >0% missingness sorted by percentage.
- **Correlations Tab:** An interactive heatmap of the Pearson correlation matrix for numeric columns. A table of highly correlated pairs (|r| > 0.8).
- **Quality Tab:** The overall quality score displayed as a large circular gauge. A breakdown showing individual factor scores (completeness, uniqueness, consistency). A list of flagged issues.

### Backend Logic
1. **Type Detection Algorithm:**
   ```
   For each column:
     Sample 1000 non-null values
     Attempt numeric parse → if >80% success → "numeric"
     Else attempt datetime parse → if >80% success → "datetime"
     Else if unique_count / total_count < 0.2 AND unique_count < 100 → "categorical"
     Else → "text"
   ```
2. **Statistics Computation:** Use vectorized operations (NumPy-style via `simple-statistics` or equivalent JS library) for performance.
3. **Chunked Processing:** For files > 10MB, read in 10,000-row chunks. Accumulate running statistics (Welford's algorithm for mean/variance).
4. **Storage:** Insert one row per column into `column_profiles` with all computed statistics as JSON fields. Insert one row into `dataset_profiles` with dataset-level metrics.

### Validation Rules
| Rule | Condition | Handling |
|------|-----------|----------|
| Minimum columns | Dataset must have at least 1 column | Mark as "failed" with error: "Dataset has no columns." |
| Minimum rows | Dataset must have at least 1 data row | Mark as "failed" with error: "Dataset has no data rows." |
| Maximum columns | Dataset must have ≤ 10,000 columns | Mark as "failed" with error: "Dataset exceeds the 10,000 column limit." |
| Memory limit | Profiling must not exceed 512MB memory | If exceeded, reduce chunk size and retry. If still failing, mark as "failed". |

### Edge Cases
- **Single-column datasets:** Profile normally. Correlation tab shows "Not enough numeric columns for correlation analysis."
- **All-null columns:** Detected as type "empty". Displayed with a warning: "This column contains only null values."
- **Constant columns (all same value):** Flagged as "Low variance" with a warning. Included in quality score calculation.
- **High-cardinality columns (>90% unique):** Detected as "text" or "identifier". Warning: "This column appears to be an identifier and may not be suitable for analysis."
- **Mixed-type columns:** Detected as "mixed". Warning: "This column contains multiple data types. Consider cleaning before analysis."
- **Very wide datasets (>1000 columns):** Profile page uses virtualized scrolling for column cards. Correlation heatmap is limited to the top 50 most variable columns.
- **Very tall datasets (>1M rows):** Statistics are computed on a stratified sample of 100,000 rows. A note is displayed: "Statistics computed on a sample of 100,000 rows for performance."

### Success Criteria
- Profiling completes in < 10 seconds for a 100K-row, 50-column CSV on a standard server.
- Data type detection achieves > 90% accuracy on standard datasets.
- All statistics are computed without memory errors for files up to 100MB.
- Profile page loads in < 2 seconds after profiling is complete.

---

## 6.3 Missing Value Analysis

### Purpose
Provide a detailed, visual understanding of missing data patterns across the dataset, enabling users to make informed decisions about imputation strategies and data quality.

### Description
Missing value analysis goes beyond simple null counts. It identifies patterns in missingness, correlates missing values across columns, and visualizes the spatial distribution of missing data across rows. This helps users understand whether data is missing completely at random (MCAR), missing at random (MAR), or missing not at random (MNAR).

### Workflow
1. During profiling, the engine records the position (row, column) of every null/empty/NA value.
2. Column-level missing counts and percentages are computed.
3. Pairwise missing correlation is computed: for each pair of columns, compute the correlation of their missing-value indicators (1 if null, 0 if not).
4. The missing value matrix is stored as a sparse representation (only non-zero positions).
5. On the Missing Values tab, the frontend renders:
   - A bar chart of missing percentage per column.
   - A heatmap of the missing value matrix.
   - A table of column pairs with high missing correlation (> 0.5).

### Expected UI
- **Missing Values Tab:**
  - **Bar Chart:** Horizontal bars showing missing percentage per column, sorted descending. Columns with 0% missing are hidden by default. Color gradient from yellow (low) to red (high).
  - **Missing Matrix Heatmap:** X-axis: columns. Y-axis: row bins (100 bins for datasets > 1000 rows, else individual rows). Color: black for present, white for missing. This reveals patterns like "rows 5000–6000 are missing across columns A, B, C."
  - **Correlated Missingness Table:** A table with columns: Column A, Column B, Missing Correlation, Interpretation (e.g., "These columns tend to be missing together").
  - **Summary Cards:** Total missing cells, total missing percentage, columns with >50% missing, columns with 0% missing.

### Backend Logic
1. During chunked profiling, maintain a running count of nulls per column and a running count of co-missing pairs.
2. Missing correlation: For columns A and B, compute `corr(is_null(A), is_null(B))` using the point-biserial correlation formula.
3. Store results in the `missing_analysis` table with: datasetId, columnPairs (JSON), missingMatrix (sparse JSON), summary (JSON).

### Validation Rules
| Rule | Condition | Handling |
|------|-----------|----------|
| No missing values | All columns have 0% missing | Display: "No missing values detected. This dataset is complete." |
| All missing | A column is 100% null | Flag: "This column is entirely empty and should be removed or investigated." |

### Edge Cases
- **Placeholder values that aren't null:** Detect common placeholders ("N/A", "n/a", "NA", "null", "None", "-", "", "missing", "unknown") and treat them as missing. Report: "X values were detected as likely missing data (e.g., 'N/A', '-')."
- **Empty strings vs. null:** Distinguish between truly null values and empty strings. Report both counts separately.
- **Large datasets:** For datasets > 500K rows, compute missing correlation on a random sample of 50K rows.

### Success Criteria
- Missing value analysis completes as part of the profiling pipeline with < 2 seconds additional overhead.
- The missing value heatmap renders in < 3 seconds for datasets up to 100K rows.
- Missing correlation identifies known co-missing patterns with > 85% precision.

---

## 6.4 Correlation Analysis

### Purpose
Quantify and visualize the linear and rank relationships between numeric columns, helping users identify multicollinearity, feature relationships, and potential data quality issues.

### Description
The correlation analysis computes pairwise correlation coefficients for all numeric columns in the dataset. It supports Pearson (linear) and Spearman (rank) correlation. Results are presented as an interactive heatmap with tooltips and a table of notable correlations.

### Workflow
1. During profiling, extract all columns detected as "numeric."
2. Compute the Pearson correlation matrix using the formula: `r = Σ((x - x̄)(y - ȳ)) / √(Σ(x - x̄)² * Σ(y - ȳ)²)`
3. Compute the Spearman correlation matrix by first ranking the values, then computing Pearson on the ranks.
4. Identify pairs with |r| > 0.8 (strong), |r| > 0.5 (moderate), |r| < 0.1 (weak).
5. Store the correlation matrix and notable pairs in the database.
6. Render the heatmap and table on the Correlations tab.

### Expected UI
- **Correlation Heatmap:** A square grid with numeric columns on both axes. Color scale: deep blue (r = -1) → white (r = 0) → deep red (r = 1). Hovering over a cell shows: "Column A vs Column B: r = 0.87 (Pearson)". Clicking a cell highlights the corresponding scatter plot.
- **Correlation Toggle:** A switch to toggle between Pearson and Spearman correlation.
- **Notable Pairs Table:** A table below the heatmap listing column pairs with |r| > 0.5, sorted by absolute value. Columns: Column A, Column B, Pearson r, Spearman ρ, Strength (Strong/Moderate).
- **Scatter Plot (on cell click):** A scatter plot of the selected column pair with a trend line.

### Backend Logic
1. **Pearson Correlation:**
   ```
   For each pair (i, j) of numeric columns:
     Compute mean_i, mean_j
     Compute covariance(i, j) = mean((x_i - mean_i) * (x_j - mean_j))
     Compute std_i, std_j
     r = covariance(i, j) / (std_i * std_j)
   ```
2. **Spearman Correlation:** Rank-transform each column, then compute Pearson on ranks.
3. **Performance:** For datasets with > 100 numeric columns, compute correlations on a random sample of 50K rows. For > 500 numeric columns, limit the heatmap to the top 50 most variable columns.
4. **Storage:** Store the full correlation matrix as a JSON object in the `correlation_analysis` table.

### Validation Rules
| Rule | Condition | Handling |
|------|-----------|----------|
| Minimum numeric columns | At least 2 numeric columns required | Display: "Correlation analysis requires at least 2 numeric columns." |
| Constant columns | A column has std = 0 | Exclude from correlation matrix. Note: "Column X was excluded (constant value)." |

### Edge Cases
- **NaN in correlation (all-null pairs):** Exclude from the matrix. Display as grey in the heatmap.
- **Perfect correlation (r = 1.0):** Flag as "Potential duplicate column."
- **Negative correlation:** Display prominently as it may indicate inverse relationships worth investigating.
- **Non-linear relationships:** Spearman correlation will detect monotonic non-linear relationships that Pearson misses. Encourage users to check both.

### Success Criteria
- Correlation matrix computation completes in < 5 seconds for 50 numeric columns and 100K rows.
- Heatmap renders in < 2 seconds.
- All notable pairs (|r| > 0.5) are correctly identified.

---

## 6.5 Interactive Visualizations

### Purpose
Transform raw statistical data into interactive, explorable visual charts that make dataset characteristics immediately understandable without requiring statistical expertise.

### Description
The visualization engine renders multiple chart types (histograms, bar charts, box plots, pie charts, scatter plots, heatmaps) directly in the browser. All charts are interactive with hover tooltips, zoom, pan, and click-to-filter capabilities. Charts are generated from the profiling data and embedded throughout the profile page.

### Workflow
1. Profile data (statistics, distributions, frequencies) is fetched via the `/api/datasets/{id}/profile` endpoint.
2. The frontend charting library (Recharts, Chart.js, or D3.js) renders charts based on the data.
3. Charts update reactively when the user switches tabs, filters columns, or resizes the window.
4. Clicking on chart elements (bars, points, cells) triggers contextual actions (filter, drill-down, highlight).

### Expected UI
- **Histograms (Numeric Columns):** Displayed on each numeric column card. X-axis: value bins. Y-axis: frequency. Tooltip: "Bin: 10–20, Count: 1,234 (12.3%)". Color: gradient from blue to purple.
- **Bar Charts (Categorical Columns):** Displayed on each categorical column card. X-axis: category values. Y-axis: frequency. Tooltip: "Category: 'Yes', Count: 5,678 (56.7%)". Show top 10 categories with an "+X more" indicator.
- **Box Plots (Numeric Columns):** Displayed in the expanded column view. Shows: min, Q1, median, Q3, max, and outliers as individual points. Tooltip: "Median: 45.2, IQR: 23.1–67.8".
- **Pie Charts (Data Type Breakdown):** Displayed on the Overview tab. Slices: Numeric, Categorical, Datetime, Text, Boolean, Empty. Tooltip: "Numeric: 23 columns (46%)".
- **Scatter Plots (Column Pairs):** Rendered when a user clicks a correlation matrix cell. X-axis: Column A. Y-axis: Column B. Trend line overlaid. Tooltip: "x: 45.2, y: 67.8".
- **Missing Value Heatmap:** See Feature 6.3.
- **Correlation Heatmap:** See Feature 6.4.

### Backend Logic
- Visualizations are entirely frontend-rendered. The backend provides structured data via API endpoints.
- Chart data is pre-computed during profiling and stored as JSON fields in the profile tables.
- For histograms: bin count is determined by Sturges' rule (`bins = 1 + 3.322 * log10(n)`), capped at 50 bins.
- For box plots: outliers are defined as values beyond 1.5 × IQR from Q1/Q3.

### Validation Rules
| Rule | Condition | Handling |
|------|-----------|----------|
| Single-value column | Column has only 1 unique value | Display: "No distribution to visualize (constant value)." |
| All-null column | Column is 100% missing | Display: "No data to visualize." |
| Too many categories | Categorical column has > 100 unique values | Display top 10 with "+X more" indicator. |

### Edge Cases
- **Skewed distributions:** Histograms with extreme skew may look empty. Use log scale option for highly skewed data.
- **Datetime columns:** Use time-series line chart instead of histogram. X-axis: time bins. Y-axis: count.
- **Mixed-type columns:** Skip visualization. Display: "Cannot visualize mixed-type column."
- **Large datasets (>100K rows):** Downsample to 10K points for scatter plots. Use aggregated counts for histograms.

### Success Criteria
- All charts render in < 1 second from cached profile data.
- Charts are responsive and readable on screens from 375px to 2560px wide.
- Hover tooltips appear within 100ms of mouse hover.
- Charts are accessible (keyboard navigable, screen-reader compatible alt text).

---

## 6.6 Report Generation

### Purpose
Produce a self-contained, downloadable document that summarizes the complete dataset profile, enabling users to share findings with stakeholders, include in academic submissions, or archive for documentation.

### Description
The report generator compiles all profiling results, visualizations, quality scores, and recommendations into a formatted PDF or HTML document. Reports are generated asynchronously and stored for download.

### Workflow
1. User clicks "Download Report" on the dataset profile page.
2. A report generation job is enqueued in the background queue.
3. The job fetches the complete profile data from the database.
4. The report template is populated with:
   - Dataset overview (name, description, upload date, dimensions, tags).
   - Column-by-column statistics table.
   - Key visualizations rendered as static images (using server-side chart rendering or pre-captured SVGs).
   - Data quality score and breakdown.
   - Missing value summary.
   - Correlation highlights.
   - Recommendations section (e.g., "Column X has 60% missing values — consider imputation or removal").
5. The report is rendered to PDF (using Puppeteer, wkhtmltopdf, or a PDF library).
6. The PDF is stored and the user is notified with a download link.

### Expected UI
- **Report Button:** A "Download Report" button in the profile page header. On click, shows a dropdown: "PDF Report" and "HTML Report."
- **Generation State:** After clicking, the button changes to "Generating report..." with a spinner. A toast notification appears: "Your report is being generated. This may take up to 30 seconds."
- **Download State:** When ready, the button changes to "Download Report (PDF, 2.3 MB)". A persistent notification appears until dismissed.
- **Report Preview (optional):** A modal showing a preview of the first page before downloading.

### Backend Logic
1. **Template Engine:** Use a pre-defined HTML/CSS template with placeholders for data.
2. **Chart Rendering:** Pre-render charts as SVG strings during profiling and store them in the database. For reports, embed SVGs directly in the HTML template.
3. **PDF Generation:** Use Puppeteer to render the populated HTML template to PDF with proper page breaks, headers, and footers.
4. **Storage:** Save the PDF to `/data/reports/{userId}/{datasetId}/report_{timestamp}.pdf`.
5. **Cleanup:** Reports older than 30 days are automatically deleted (configurable).

### Validation Rules
| Rule | Condition | Handling |
|------|-----------|----------|
| Profile must exist | Dataset must have a completed profile | Disable report button. Tooltip: "Report available after profiling completes." |
| Rate limiting | Max 10 reports per hour per user | Show: "Report generation limit reached. Please try again in X minutes." |

### Edge Cases
- **Very large datasets:** Reports for datasets > 1M rows may take longer. Show estimated time: "This may take up to 2 minutes for large datasets."
- **Datasets with many columns (>200):** The column statistics table is paginated in the report. Include a note: "Showing top 50 columns. Full statistics available in the platform."
- **Failed report generation:** Retry once. If still failing, notify the user: "Report generation failed. Please try again."

### Success Criteria
- PDF report generates in < 30 seconds for a 100K-row, 50-column dataset.
- Report file size is < 5MB for datasets up to 100 columns.
- All visualizations in the report are legible when printed on A4 paper.
- Reports are stored and downloadable for at least 30 days.

---

## 6.7 Data Quality Scoring

### Purpose
Provide a single, interpretable number (0–100) that summarizes the overall quality of a dataset, giving users an immediate sense of how suitable the data is for analysis or modeling.

### Description
The data quality score is a composite metric derived from four factors: completeness (missing values), uniqueness (duplicates), consistency (type uniformity), and structure (column naming, encoding). Each factor contributes a weighted sub-score, and the overall score is the weighted average.

### Workflow
1. During profiling, compute each sub-score:
   - **Completeness Score (40% weight):** `100 - (total_missing_cells / total_cells * 100)`
   - **Uniqueness Score (25% weight):** `100 - (duplicate_rows / total_rows * 100)`
   - **Consistency Score (20% weight):** Percentage of columns where >90% of values match the detected data type.
   - **Structure Score (15% weight):** Based on column naming conventions (no special characters, no spaces, consistent casing) and encoding (UTF-8 preferred).
2. Overall score = `0.4 * completeness + 0.25 * uniqueness + 0.2 * consistency + 0.15 * structure`
3. Store the score and breakdown in the `quality_scores` table.
4. Display the score on dataset cards and the profile page.

### Expected UI
- **Dashboard Card:** Each dataset card shows the quality score as a colored badge: Green (80–100), Yellow (60–79), Red (0–59).
- **Profile Page — Quality Tab:**
  - A large circular gauge showing the overall score (0–100) with the color.
  - Four sub-gauges below showing individual factor scores.
  - A breakdown table: Factor, Weight, Score, Weighted Contribution.
  - A list of actionable issues: "Column X has 60% missing values — consider imputation." "45 duplicate rows detected — consider deduplication."

### Backend Logic
1. Sub-scores are computed during the profiling pipeline.
2. Weights are configurable (stored in a config file or database).
3. Issues are generated by rules engine:
   - Any column > 50% missing → "High missingness in {column}"
   - Duplicate rows > 5% → "Significant duplication detected"
   - Any column with mixed types → "Inconsistent types in {column}"
   - Column names with spaces or special characters → "Non-standard column naming"

### Validation Rules
| Rule | Condition | Handling |
|------|-----------|----------|
| Score range | Score must be 0–100 | Clamp to range. |
| Rounding | Score displayed as integer | Round to nearest whole number. |

### Edge Cases
- **Empty dataset (0 rows):** Score = 0. Issue: "Dataset contains no data."
- **Perfect dataset (no issues):** Score = 100. Display: "Excellent! No quality issues detected."
- **Single-column dataset:** Consistency and structure scores still apply. Uniqueness score may be misleading if the column is an identifier.

### Success Criteria
- Quality score computation adds < 500ms to profiling time.
- Score accurately reflects dataset quality as validated against manual assessment on 20 benchmark datasets.
- Users report that the score is "useful" and "accurate" in > 80% of feedback surveys.

---

## 6.8 Dataset Search and Filtering

### Purpose
Enable users to quickly locate datasets in their personal catalog by searching across names, descriptions, tags, and metadata, and filtering by quantitative criteria.

### Description
The search feature provides full-text search with ranked results and faceted filtering. It is designed for users who maintain a growing catalog of datasets and need to find specific ones without scrolling through pages of cards.

### Workflow
1. User types a query in the search bar on the dashboard.
2. The frontend sends the query to `/api/datasets/search?q={query}&filters={json}`.
3. The backend searches across:
   - Dataset name (highest weight)
   - Description (medium weight)
   - Tags (medium weight)
   - Column names (low weight)
   - Metadata fields (low weight)
4. Results are ranked by relevance (BM25 or TF-IDF scoring) and returned with applied filters.
5. Frontend renders results as dataset cards with search term highlighting.

### Expected UI
- **Search Bar:** A prominent search input at the top of the dashboard with a magnifying glass icon. Placeholder: "Search datasets by name, description, tags, or column names..." Supports debounced input (300ms delay).
- **Filter Panel:** A collapsible sidebar or dropdown with filters:
  - Upload date: Date range picker (from/to).
  - Quality score: Range slider (0–100).
  - Row count: Range inputs (min/max).
  - Tags: Multi-select dropdown populated with user's existing tags.
  - Data types: Multi-select (Numeric, Categorical, Datetime, Text).
- **Results:** Dataset cards with search terms highlighted in yellow. Pagination at the bottom. Sort options: Relevance (default), Newest, Oldest, Name A–Z, Quality Score (high to low).
- **Empty State:** "No datasets match your search. Try different keywords or adjust filters."

### Backend Logic
1. **Full-Text Search:** Use PostgreSQL full-text search with `tsvector` and `tsquery`, or a simple in-memory search index for smaller catalogs.
2. **Ranking:** Weight name matches 3x, description matches 2x, tag/column matches 1x.
3. **Filtering:** Apply filters as WHERE clauses before search ranking.
4. **Pagination:** Return 12 results per page (configurable). Include total count for pagination UI.

### Validation Rules
| Rule | Condition | Handling |
|------|-----------|----------|
| Minimum query length | Query must be ≥ 2 characters | Don't search. Show: "Type at least 2 characters to search." |
| Maximum query length | Query must be ≤ 200 characters | Truncate with warning. |

### Edge Cases
- **No datasets:** Display an empty state with a "Upload your first dataset" CTA.
- **Special characters in query:** Escape regex-special characters. Treat as literal search terms.
- **Very common terms (e.g., "data"):** May return all results. Relevance ranking ensures best matches appear first.

### Success Criteria
- Search results return in < 500ms for catalogs up to 1,000 datasets.
- Relevant datasets appear in the top 3 results > 90% of the time.
- Filters correctly narrow results with no false positives.

---

## 6.9 Dataset Comparison

### Purpose
Allow users to compare two datasets side by side to identify schema differences, statistical divergences, and structural changes, supporting workflows like data versioning, preprocessing validation, and schema migration.

### Description
The comparison feature takes two datasets and produces a structured diff covering schema (column names, types, order), statistics (mean, median, distribution), and structure (row count, missing values). It is presented as a visual diff with additions, removals, and changes highlighted.

### Workflow
1. User selects two datasets from the dashboard (checkboxes or "Compare" buttons).
2. User clicks "Compare Selected" to initiate comparison.
3. Frontend sends a request to `/api/datasets/compare` with both dataset IDs.
4. Backend fetches both profiles and computes:
   - Schema diff: columns in A but not B, columns in B but not A, columns in both but with different types.
   - Statistical diff: for shared numeric columns, compute the difference in mean, median, std, min, max.
   - Structural diff: row count difference, column count difference, missing value percentage difference.
5. Results are returned and rendered as a comparison view.

### Expected UI
- **Comparison Header:** Shows both dataset names with a "↔" between them. Dimensions listed for each.
- **Schema Diff Tab:**
  - Three sections: "Added in B" (green), "Removed from A" (red), "Changed" (yellow).
  - Each section lists affected columns with their types.
- **Statistics Diff Tab:**
  - A table with columns: Column Name, Statistic, Dataset A, Dataset B, Difference, Change %.
  - Rows for: Mean, Median, Std, Min, Max, Missing %, Unique Count.
  - Significant differences (>20% change) are highlighted in yellow.
- **Visual Diff Tab:**
  - Side-by-side histograms for shared numeric columns.
  - Side-by-side bar charts for shared categorical columns.
  - Overlay line charts showing distribution shifts.

### Backend Logic
1. Fetch both dataset profiles from the database.
2. **Schema Diff:** Compare column sets using set operations (intersection, difference).
3. **Statistical Diff:** For each shared column, compute `abs(statA - statB) / max(abs(statA), abs(statB), 1) * 100` for percentage difference.
4. **Structural Diff:** Simple subtraction for row/column counts. Percentage point difference for missing rates.
5. Return structured JSON with all diff components.

### Validation Rules
| Rule | Condition | Handling |
|------|-----------|----------|
| Both datasets must be profiled | Profiling must be complete for both | Show: "Both datasets must be fully profiled before comparison." |
| Different datasets | Cannot compare a dataset with itself | Show: "Please select two different datasets." |

### Edge Cases
- **Completely different datasets (no shared columns):** Display: "These datasets have no columns in common. Schema comparison is not meaningful."
- **Different row counts:** Normalize statistics for comparison. Note: "Dataset A has 2x more rows than Dataset B. Statistics may not be directly comparable."
- **One dataset much larger:** Limit comparison to the first 100K rows of each.

### Success Criteria
- Comparison completes in < 5 seconds for datasets up to 100 columns.
- Schema diff correctly identifies all additions, removals, and type changes.
- Statistical diff highlights meaningful differences (>10% change) with > 95% accuracy.

---

## 6.10 Dataset Version History

### Purpose
Maintain a chronological record of all uploads and modifications to a dataset, enabling users to track changes over time and revert to previous states if needed.

### Description
Every time a user uploads a new file with the same name as an existing dataset (or explicitly creates a new version), a version snapshot is created. Each version stores the file, profile, metadata, and timestamp independently. Users can browse version history and view any previous version's profile.

### Workflow
1. When a user uploads a file with the same name as an existing dataset, the system prompts: "A dataset named 'X' already exists. Create a new version?"
2. If confirmed, the new file is stored as a new version linked to the same dataset ID.
3. A version record is created with: version number (auto-incremented), upload timestamp, file path, file size, row count, column count, metadata snapshot.
4. The profiling pipeline runs on the new version.
5. Users can view the version list from the dataset detail page.
6. Clicking a version loads that version's profile.

### Expected UI
- **Version History Tab:** A timeline view showing all versions. Each entry shows: version number, upload date, file size, dimensions, quality score, and a "View Profile" button.
- **Current Version Badge:** The latest version is marked with a "Current" badge.
- **Version Selector:** A dropdown on the profile page to switch between versions: "Version 3 (Current) — Jun 30, 2026", "Version 2 — Jun 15, 2026", etc.
- **Version Comparison Shortcut:** A "Compare Versions" button that opens the comparison view with the current version and a selected previous version.

### Backend Logic
1. **Version Detection:** On upload, check if a dataset with the same name and user ID exists. If yes, prompt for version creation.
2. **Version Numbering:** Auto-increment from the highest existing version number for that dataset.
3. **Storage:** Each version has its own file in `/data/uploads/{userId}/{datasetId}/v{version}/{filename}`.
4. **Profile Association:** Each version's profile is stored independently in the `dataset_profiles` table with a `versionId` foreign key.
5. **Rollback:** Not implemented in V1. Users can view but not revert. Reverting would require re-uploading the old file.

### Validation Rules
| Rule | Condition | Handling |
|------|-----------|----------|
| Max versions | Max 50 versions per dataset | Show: "Version limit reached. Delete older versions to create new ones." |
| Version naming | Auto-generated (v1, v2, ...) | No user-defined version names in V1. |

### Edge Cases
- **Re-uploading the exact same file:** Create a version but flag it: "This file is identical to Version X."
- **Different file format (CSV → Excel):** Allowed. The version records the new format.
- **Version deletion:** Allow deleting non-current versions. Cannot delete the current version. Deleting a version does not affect other versions.

### Success Criteria
- Version creation adds < 1 second to the upload flow.
- Version list loads in < 1 second for datasets with up to 50 versions.
- Switching between version profiles takes < 2 seconds.

---

## 6.11 Responsive Dashboard

### Purpose
Provide a central hub where users can view, manage, search, and act on all their uploaded datasets in a clean, organized, and responsive interface.

### Description
The dashboard is the landing page after login. It displays all user datasets as cards in a responsive grid, with search, filter, sort, and view-toggle controls. Quick actions on each card allow users to view profiles, download reports, compare datasets, and manage metadata.

### Workflow
1. User logs in and is redirected to `/dashboard`.
2. The frontend fetches datasets from `/api/datasets?page=1&sort=newest`.
3. Datasets are rendered as cards in a responsive grid.
4. User can search, filter, sort, and toggle between grid and list views.
5. Clicking a card navigates to the dataset profile page.

### Expected UI
- **Header:** "My Datasets" title, dataset count, "Upload Dataset" button (primary CTA).
- **Controls Bar:** Search input, filter dropdown, sort dropdown, view toggle (grid/list icons).
- **Grid View (default):** Cards in a 3-column grid (desktop), 2-column (tablet), 1-column (mobile). Each card shows: dataset name, description (truncated to 2 lines), tags (as chips), upload date (relative: "2 days ago"), dimensions ("1,234 rows × 56 columns"), quality score badge.
- **List View:** A table with columns: Name, Rows, Columns, Quality, Uploaded, Actions.
- **Card Actions (on hover/click):** "View Profile", "Download Report", "Compare", "Edit", "Delete" (with confirmation).
- **Empty State:** A centered illustration with text: "No datasets yet. Upload your first dataset to get started." and an "Upload Dataset" button.
- **Pagination:** "Load More" button or infinite scroll at the bottom.

### Backend Logic
1. **Endpoint:** `GET /api/datasets?page={page}&limit={limit}&sort={sort}&search={query}&filters={json}`
2. **Sorting Options:** newest, oldest, name_asc, name_desc, quality_high, quality_low, rows_high, rows_low.
3. **Pagination:** Return 12 datasets per page. Include `totalCount`, `page`, `totalPages` in response.
4. **Filtering:** Apply all filters server-side before pagination.

### Validation Rules
| Rule | Condition | Handling |
|------|-----------|----------|
| Auth required | User must be logged in | Redirect to `/login` if not authenticated. |
| Page bounds | Page number must be ≥ 1 and ≤ totalPages | Clamp to valid range. |

### Edge Cases
- **Single dataset:** Card takes full width on mobile, 1/3 on desktop.
- **Long dataset names:** Truncate with ellipsis. Full name shown on hover tooltip.
- **Many datasets (>100):** Pagination handles this. Show total count: "Showing 1–12 of 156 datasets."
- **Slow loading:** Show skeleton cards (grey placeholders with animation) while data loads.

### Success Criteria
- Dashboard loads in < 2 seconds for users with up to 500 datasets.
- Search results update within 500ms of typing.
- All actions (view, report, compare, edit, delete) are accessible within 2 clicks from the dashboard.

---

## 6.12 Metadata Management

### Purpose
Allow users to enrich datasets with descriptive metadata (name, description, tags, custom fields) that makes datasets discoverable, documented, and understandable by others.

### Description
Metadata management enables users to add, edit, and search structured and free-text metadata associated with their datasets. Metadata is stored separately from the dataset file and profile, and is included in search indexing and report generation.

### Workflow
1. At upload time, users provide: name (required), description (optional), tags (optional).
2. After upload, users can edit metadata from the dataset detail page.
3. Users can add custom key-value metadata fields (e.g., "Source: Kaggle", "Collection Date: 2024-01-15", "Ethics Approval: IRB-2024-042").
4. Metadata changes are versioned: each edit creates a metadata snapshot linked to the current version.
5. Metadata is indexed for search.

### Expected UI
- **Upload Form:** Name (required text input), Description (optional textarea, 500 char limit), Tags (optional, comma-separated input that converts to chips on comma or Enter).
- **Dataset Detail Page — Metadata Section:**
  - Editable name (click to edit, inline).
  - Editable description (click to edit, textarea).
  - Tag chips with "×" to remove. "+ Add Tag" input.
  - Custom fields table: Key | Value | Actions (edit, delete). "+ Add Field" button.
- **Metadata in Search:** Tags and custom fields are searchable. Tags appear as filter options.

### Backend Logic
1. **Storage:** Metadata is stored in the `dataset_metadata` table: id, datasetId, versionId, key, value, createdAt, updatedAt.
2. **Default Fields:** name, description, tags are treated as special keys with dedicated columns in the `datasets` table for query performance.
3. **Custom Fields:** Stored as key-value pairs in the `dataset_metadata` table.
4. **Search Indexing:** On metadata change, update the search index (full-text search vector).
5. **Validation:** Keys must be alphanumeric with underscores, max 50 chars. Values max 500 chars. Max 50 custom fields per dataset.

### Validation Rules
| Rule | Condition | Handling |
|------|-----------|----------|
| Name required | Name must not be empty | Show: "Dataset name is required." |
| Name length | Max 200 characters | Show: "Name must be 200 characters or fewer." |
| Description length | Max 1000 characters | Show: "Description must be 1000 characters or fewer." |
| Tag count | Max 20 tags per dataset | Show: "Maximum 20 tags allowed." |
| Tag length | Max 50 characters per tag | Truncate with warning. |
| Custom field key | Must be alphanumeric + underscores, max 50 chars | Show: "Key must contain only letters, numbers, and underscores." |
| Custom field value | Max 500 characters | Show: "Value must be 500 characters or fewer." |

### Edge Cases
- **Duplicate tags:** Silently deduplicate. "data-science, data-science" → "data-science".
- **Empty tags:** Remove empty strings after splitting by comma.
- **Special characters in description:** Allow all Unicode. Escape for display.
- **Metadata on shared datasets (future):** Metadata edits would require permission checks. For V1 (single-user), this is not a concern.

### Success Criteria
- Metadata edits save in < 500ms.
- Updated metadata is searchable within 1 second.
- Users can add custom fields without page reload.

---

*End of DataScope AI Project Documentation*
