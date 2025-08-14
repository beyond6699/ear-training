import json
import os
import time
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# --- 配置 ---
DOMAIN_URL = "https://dev.epicgames.com"
CLASSES_URL = "https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Classes"
OUTPUT_FILE = os.path.join("unreal-sdk-browser", "public", "sdk.json")

# --- Selenium 设置 ---
def get_driver():
    """初始化并返回一个 Selenium WebDriver 实例"""
    options = webdriver.ChromeOptions()
    # 必须使用带界面的浏览器，不能用 --headless 模式
    options.add_argument("--start-maximized")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    
    service = ChromeService(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    return driver

def get_soup_from_driver(driver, url, wait_for_selector):
    """使用 Selenium 加载页面，并等待特定元素出现后再返回 BeautifulSoup 对象"""
    try:
        driver.get(url)
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, wait_for_selector))
        )
        return BeautifulSoup(driver.page_source, "html.parser")
    except Exception as e:
        print(f"Error loading page {url} or finding element {wait_for_selector}: {e}")
        return None

# --- 主逻辑 ---
def main():
    driver = get_driver()
    sdk_data = []

    print(f"Starting scraper... Navigating to class list: {CLASSES_URL}")
    driver.get(CLASSES_URL)

    # --- 等待用户手动验证 ---
    input("\n>>> A browser window has opened. Please complete the human verification (CAPTCHA) in the browser, then press Enter in this terminal to continue...")
    
    print("\nVerification complete. Resuming scraping...")
    
    # 现在页面已经通过验证，我们可以安全地获取内容了
    class_list_soup = BeautifulSoup(driver.page_source, "html.parser")
    class_links = class_list_soup.select("a[data-pathname]")
    print(f"Found {len(class_links)} classes. Scraping a few as a sample...")

    for class_link in class_links[:5]:
        class_name = class_link.text.strip()
        class_url = urljoin(DOMAIN_URL, class_link['href'])
        print(f"\nScraping Class: {class_name}")

        # 对于后续页面，通常不需要再次验证
        class_soup = get_soup_from_driver(driver, class_url, "tbody")
        if not class_soup:
            continue

        module, header, include = "N/A", "N/A", "N/A"
        
        module_key_cell = class_soup.find("td", string="Module")
        if module_key_cell and module_key_cell.find_next_sibling("td"):
            module = module_key_cell.find_next_sibling("td").text.strip()

        header_key_cell = class_soup.find("td", string="Header")
        if header_key_cell and header_key_cell.find_next_sibling("td"):
            header = header_key_cell.find_next_sibling("td").text.strip()

        include_key_cell = class_soup.find("td", string="Include")
        if include_key_cell and include_key_cell.find_next_sibling("td"):
            include = include_key_cell.find_next_sibling("td").text.strip()
        
        description_element = class_soup.select_one("div.description p")
        description = description_element.text.strip() if description_element else "No description found."

        sdk_data.append({
            "name": class_name,
            "module": module,
            "header": header,
            "include": include,
            "description": description,
            "functions": []
        })
        print(f"  - Module: {module}")
        print(f"  - Header: {header}")
        print(f"  - Include: {include}")
        time.sleep(0.5)

    driver.quit()

    print(f"\nScraping finished. Saving data to {OUTPUT_FILE}...")
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(sdk_data, f, indent=2, ensure_ascii=False)

    print("Done!")

if __name__ == "__main__":
    main()