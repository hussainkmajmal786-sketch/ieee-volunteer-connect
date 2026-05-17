# Rollback and Disaster Recovery

## Hosting Rollback

1. Open Firebase Console > Hosting > Releases.
2. Select the last known-good release.
3. Click "Rollback".

CLI alternative:

```bash
firebase hosting:rollback
```

## Firestore Backup

The `scheduledFirestoreExport` Cloud Function runs every 24 hours and exports all
Firestore collections to:

```text
gs://<project-id>-firestore-backups/<yyyy-mm-dd>
```

The function creates the bucket if it does not already exist. The Functions
runtime service account needs these IAM roles:

- Cloud Datastore Import Export Admin
- Storage Admin, or a narrower bucket-level role after the first bucket create
- Cloud Scheduler Service Agent permissions for scheduled functions

## Firestore Restore

1. Identify the backup prefix:

```bash
gcloud storage ls gs://ieee-vc-cek-main-firestore-backups/
```

2. Restore the selected export:

```bash
gcloud firestore import gs://ieee-vc-cek-main-firestore-backups/YYYY-MM-DD
```

3. Validate the app in Firebase Hosting preview or locally before reopening admin workflows.

## Release Safety Checklist

Run these before major releases:

```bash
npm run lint
npm run build
npm audit --audit-level=high
npm test
npm run test:rules
npm run test:load
```

## Emergency Contacts

- Primary owner: hussainkmajmal786@gmail.com
- Firebase project: ieee-vc-cek-main
- GitHub repository: hussainkmajmal786-sketch/ieee-volunteer-connect
