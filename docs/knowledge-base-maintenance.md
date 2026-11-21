# Detroit Connect knowledge base

The AI search uses `knowledge_sources` and `knowledge_chunks`. Keep one source per official publisher or document, and only set `status = 'approved'` after a human review.

Recommended source record fields:

- `title`: clear publisher and subject
- `source_url` or `storage_path`: the traceable original
- `category`: childcare, housing, transportation, jobs, events, food, or services
- `publisher`: the organization responsible for the information
- `jurisdiction`: the area covered
- `reviewed_at`: when the source was checked
- `expires_at`: when it should be checked again
- `review_notes`: what was verified and any limitations

Use primary government, nonprofit, school, transit, licensing, and provider sources. Do not add rankings, testimonials, scraped personal data, or claims that cannot be traced to the source. Keep the demo fallback only for staging; production answers should come from approved, current sources.
