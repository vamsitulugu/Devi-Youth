from pathlib import Path
from os import environ
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(r"C:\Users\vamsi\Downloads\grama-ganapati-final\project")
CAPTURES = ROOT / "tmp" / environ.get("CAPTURES_SUBDIR", "app-screenshots")
OUTPUT = ROOT / "output" / "pdf" / environ.get("OUTPUT_FILENAME", "devi-youth-app-screenshots.pdf")
CATALOGUE_TITLE = environ.get("CATALOGUE_TITLE", "Complete App Screenshot Catalogue")
CATALOGUE_SUBTITLE = environ.get("CATALOGUE_SUBTITLE", "Villager screens and committee entry screens")

PAGES = [
    ("Villager App", "Home", "01-home.png", "#/"),
    ("Villager App", "Announcements", "02-announcements.png", "#/announcements"),
    ("Villager App", "Events", "03-events.png", "#/events"),
    ("Villager App", "Gallery", "04-gallery.png", "#/gallery"),
    ("Villager App", "More", "05-more.png", "#/more"),
    ("Villager App", "Donations", "06-donations.png", "#/donations"),
    ("Villager App", "Laddu", "07-laddu.png", "#/laddu"),
    ("Villager App", "Lottery", "08-lottery.png", "#/lottery"),
    ("Villager App", "Committee", "09-committee.png", "#/committee"),
    ("Villager App", "History", "10-history.png", "#/history"),
    ("Villager App", "Contacts", "11-contacts.png", "#/contacts"),
    ("Committee App", "Committee Login", "12-committee-login.png", "#/admin/login"),
    ("Committee App", "Join with Invite", "13-committee-join.png", "#/admin/join"),
    ("Committee App", "Admin Dashboard", "14-admin-dashboard.png", "#/admin"),
    ("Committee App", "Content Hub", "15-admin-content.png", "#/admin/content"),
    ("Committee App", "Manage Announcements", "16-admin-announcements.png", "#/admin/content/announcements"),
    ("Committee App", "Manage Events", "17-admin-events.png", "#/admin/content/events"),
    ("Committee App", "Manage Committee", "18-admin-committee.png", "#/admin/content/committee"),
    ("Committee App", "Manage Laddu", "19-admin-laddu.png", "#/admin/content/laddu"),
    ("Committee App", "Manage Lottery", "20-admin-lottery.png", "#/admin/content/lottery"),
    ("Committee App", "Manage Contacts", "21-admin-contacts.png", "#/admin/content/contacts"),
    ("Committee App", "Manage Donations", "22-admin-donations.png", "#/admin/content/donations"),
    ("Committee App", "Manage Expenses", "23-admin-expenses.png", "#/admin/content/expenses"),
    ("Committee App", "Money Dashboard", "24-admin-money.png", "#/admin/money"),
    ("Committee App", "Deleted Donations", "25-admin-deleted-donations.png", "#/admin/money/deleted-donations"),
    ("Committee App", "Pending Sends", "26-admin-pending-sends.png", "#/admin/money/pending-sends"),
    ("Committee App", "Manage Gallery", "27-admin-gallery.png", "#/admin/gallery"),
    ("Committee App", "Settings", "28-admin-settings.png", "#/admin/settings"),
]

PAGE_W, PAGE_H = A4
MARGIN = 28
HEADER_H = 42
FOOTER_H = 22

def draw_cover(pdf):
    pdf.setFillColor(HexColor("#C22B1F"))
    pdf.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    pdf.setFillColor(HexColor("#F6B93B"))
    pdf.circle(PAGE_W / 2, PAGE_H * 0.67, 66, fill=1, stroke=0)
    pdf.setFillColor(white)
    pdf.setFont("Helvetica-Bold", 28)
    pdf.drawCentredString(PAGE_W / 2, PAGE_H * 0.48, "Devi Youth")
    pdf.setFont("Helvetica", 17)
    pdf.drawCentredString(PAGE_W / 2, PAGE_H * 0.43, CATALOGUE_TITLE)
    pdf.setFont("Helvetica", 10)
    pdf.drawCentredString(PAGE_W / 2, PAGE_H * 0.36, CATALOGUE_SUBTITLE)
    pdf.setFillColor(HexColor("#FFECC0"))
    pdf.setFont("Helvetica", 9)
    pdf.drawCentredString(PAGE_W / 2, 52, "Source: https://deviyouth.vercel.app/")
    pdf.showPage()

def draw_page(pdf, section, title, filename, route, index):
    image_path = CAPTURES / filename
    image = ImageReader(str(image_path))
    iw, ih = image.getSize()
    available_w = PAGE_W - 2 * MARGIN
    available_h = PAGE_H - HEADER_H - FOOTER_H - 2 * MARGIN
    scale = min(available_w / iw, available_h / ih)
    width, height = iw * scale, ih * scale
    x = (PAGE_W - width) / 2
    y = FOOTER_H + MARGIN + (available_h - height) / 2

    pdf.setFillColor(HexColor("#C22B1F"))
    pdf.rect(0, PAGE_H - HEADER_H, PAGE_W, HEADER_H, fill=1, stroke=0)
    pdf.setFillColor(white)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(MARGIN, PAGE_H - 18, section.upper())
    pdf.setFont("Helvetica", 10)
    pdf.drawRightString(PAGE_W - MARGIN, PAGE_H - 18, title)
    pdf.drawImage(image, x, y, width=width, height=height, preserveAspectRatio=True, mask='auto')
    pdf.setFillColor(HexColor("#6B6259"))
    pdf.setFont("Helvetica", 8)
    pdf.drawString(MARGIN, 12, f"https://deviyouth.vercel.app/{route}")
    pdf.drawRightString(PAGE_W - MARGIN, 12, f"Screenshot {index} of {len(PAGES)}")
    pdf.showPage()

pdf = canvas.Canvas(str(OUTPUT), pagesize=A4)
pdf.setTitle("Devi Youth App Screenshot Catalogue")
pdf.setAuthor("Devi Youth")
draw_cover(pdf)
for index, page in enumerate(PAGES, start=1):
    draw_page(pdf, *page, index)
pdf.save()
print(OUTPUT)
