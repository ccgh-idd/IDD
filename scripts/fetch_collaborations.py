import urllib.request
import urllib.parse
import json
import xml.etree.ElementTree as ET
import time
import os

# Stefan Flasche's PubMed Author ID or Search Query
# The URL provided was: https://pubmed.ncbi.nlm.nih.gov/?term=Flasche+S&cauthor_id=32517683
# Let's search by author name "Flasche S"[Author] OR the cauthor_id.
# Using E-utilities from NCBI

BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
SEARCH_TERM = "Flasche S[Author]"

def fetch_pmids(term):
    print(f"Fetching PMIDs for: {term}")
    url = f"{BASE_URL}esearch.fcgi?db=pubmed&term={urllib.parse.quote(term)}&retmax=1000&retmode=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        return data['esearchresult']['idlist']

def fetch_affiliations(pmids):
    print(f"Fetching details for {len(pmids)} PMIDs")
    affiliations = set()
    
    # Fetch in batches of 200
    batch_size = 200
    for i in range(0, len(pmids), batch_size):
        batch = pmids[i:i+batch_size]
        id_str = ",".join(batch)
        url = f"{BASE_URL}efetch.fcgi?db=pubmed&id={id_str}&retmode=xml"
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                xml_data = response.read()
                root = ET.fromstring(xml_data)
                
                # Find all Affiliation tags
                for affil in root.iter('Affiliation'):
                    text = affil.text
                    if text:
                        affiliations.add(text)
        except Exception as e:
            print(f"Error fetching batch: {e}")
            
        time.sleep(0.5) # Be nice to NCBI servers
        
    return list(affiliations)

def extract_countries(affiliations):
    # Very basic country extraction from end of affiliation string
    countries = set()
    for aff in affiliations:
        # Split by comma and taking the last part is usually the country or email
        parts = [p.strip() for p in aff.split(',')]
        if parts:
            last_part = parts[-1]
            # Remove trailing periods and common emails
            last_part = last_part.replace('.', '')
            if '@' in last_part:
                if len(parts) > 1:
                    last_part = parts[-2].replace('.', '').strip()
                else:
                    continue
            
            # Simple cleanup, removing zip codes (digits)
            last_part = ''.join([c for c in last_part if not c.isdigit()]).strip()
            if last_part and len(last_part) > 2:
                countries.add(last_part)
                
    return list(countries)

def geocode_countries(countries):
    print("Geocoding countries...")
    locations = []
    
    # Simple cache to avoid hitting Nominatim too much
    cache = {
        "UK": {"lat": 55.3781, "lon": -3.4360},
        "USA": {"lat": 37.0902, "lon": -95.7129},
        "United States of America": {"lat": 37.0902, "lon": -95.7129},
        "United Kingdom": {"lat": 55.3781, "lon": -3.4360},
        "Germany": {"lat": 51.1657, "lon": 10.4515},
    }
    
    for country in countries:
        if country in cache:
            locations.append({"name": country, "lat": cache[country]["lat"], "lon": cache[country]["lon"]})
            continue
            
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(country)}&format=json&limit=1"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'IDD-Webpage-Builder/1.0'})
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode('utf-8'))
                if data:
                    lat = float(data[0]['lat'])
                    lon = float(data[0]['lon'])
                    locations.append({"name": country, "lat": lat, "lon": lon})
                    cache[country] = {"lat": lat, "lon": lon}
                    print(f"Found coordinates for {country}")
                else:
                    print(f"Could not geocode {country}")
        except Exception as e:
            print(f"Error geocoding {country}: {e}")
            
        time.sleep(1) # Nominatim policy requires 1 sec delay between requests
        
    return locations

def main():
    pmids = fetch_pmids(SEARCH_TERM)
    print(f"Found {len(pmids)} publications.")
    
    affiliations = fetch_affiliations(pmids)
    print(f"Found {len(affiliations)} unique affiliations.")
    
    countries = extract_countries(affiliations)
    print(f"Extracted {len(countries)} potential countries/locations.")
    
    # Filter out obvious junk (too long, etc.)
    filtered_countries = [c for c in countries if len(c) < 30]
    print(f"Filtered down to {len(filtered_countries)} locations.")
    
    # Fallback coordinates if the API is too slow/fails
    if len(filtered_countries) > 100:
       print("Too many to geocode without key, taking a sample or aggregating...")
       filtered_countries = list(set(filtered_countries))[:20] # Limit for this demo script
    
    locations = geocode_countries(filtered_countries)
    
    # Output to webpage directory
    out_path = '/Users/stefanflasche/Dropbox/Stuff2Read/webpage IDD/collaborations.json'
    with open(out_path, 'w') as f:
        json.dump(locations, f, indent=2)
        
    print(f"Saved {len(locations)} locations to {out_path}")

if __name__ == "__main__":
    main()
