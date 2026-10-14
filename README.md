# Shruti Dhamde Resume

A locally editable resume builder. Open the [hosted editor](https://ashwinbhajan.github.io/shruti/) or download the repository and open `index.html` in a browser.

## Editing and saving

- Click resume text to edit it. Changes are saved in that browser when local storage is available.
- Use **Save editable backup** to download a JSON copy. Use **Load backup** to restore it later or in another browser.
- **Download PDF** creates a two-page, selectable-text PDF from the current visible resume. Review the file before submitting it.
- **Download ATS text** shows the reading order and excludes the photo.
- **ATS check** flags obvious missing contact details, hidden core sections, and template placeholders. It is a basic readability check, not an ATS score.

The default phone number is masked. Replace it before applying. Submit a format accepted by the employer.

The PDF exporter bundles [pdf-lib](https://pdf-lib.js.org/) 1.17.1 under its MIT license in `assets/pdf-lib.LICENSE.md`. No external JavaScript CDN is required. Drag reordering is disabled in this offline version; text editing and adding or removing entries remain available.
