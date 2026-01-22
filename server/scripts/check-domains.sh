#!/bin/bash

# Domain checker script
# Checks SSL, HTTP->HTTPS redirection, and DNS for domains and their www equivalents

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

check_ssl() {
    local domain=$1
    echo -e "${BLUE}Checking SSL for ${domain}...${NC}"

    # Check SSL certificate
    ssl_output=$(echo | openssl s_client -servername "$domain" -connect "$domain":443 2>/dev/null)

    if echo "$ssl_output" | grep -q "Verify return code: 0"; then
        echo -e "  ${GREEN}✓ SSL Valid${NC}"

        # Get certificate expiry
        expiry=$(echo "$ssl_output" | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        if [ -n "$expiry" ]; then
            echo -e "  ${GREEN}  Expires: ${expiry}${NC}"
        fi

        # Get certificate issuer
        issuer=$(echo "$ssl_output" | openssl x509 -noout -issuer 2>/dev/null | sed 's/issuer=/  Issuer: /')
        if [ -n "$issuer" ]; then
            echo -e "  ${GREEN}${issuer}${NC}"
        fi
        return 0
    else
        error_code=$(echo "$ssl_output" | grep "Verify return code:" | head -1)
        echo -e "  ${RED}✗ SSL Invalid or connection failed${NC}"
        if [ -n "$error_code" ]; then
            echo -e "  ${RED}  ${error_code}${NC}"
        fi
        return 1
    fi
}

check_http_redirect() {
    local domain=$1
    echo -e "${BLUE}Checking HTTP -> HTTPS redirect for ${domain}...${NC}"

    # Follow redirects and check final URL
    response=$(curl -sI -o /dev/null -w "%{http_code} %{redirect_url}" --max-time 10 "http://${domain}" 2>/dev/null)
    http_code=$(echo "$response" | awk '{print $1}')
    redirect_url=$(echo "$response" | awk '{print $2}')

    if [[ "$http_code" == "301" || "$http_code" == "302" || "$http_code" == "307" || "$http_code" == "308" ]]; then
        if [[ "$redirect_url" == https://* ]]; then
            echo -e "  ${GREEN}✓ Redirects to HTTPS (${http_code})${NC}"
            echo -e "  ${GREEN}  -> ${redirect_url}${NC}"
            return 0
        else
            echo -e "  ${YELLOW}⚠ Redirects but not to HTTPS (${http_code})${NC}"
            echo -e "  ${YELLOW}  -> ${redirect_url}${NC}"
            return 1
        fi
    elif [[ "$http_code" == "200" ]]; then
        echo -e "  ${RED}✗ No redirect - HTTP returns 200${NC}"
        return 1
    else
        echo -e "  ${RED}✗ HTTP request failed (code: ${http_code})${NC}"
        return 1
    fi
}

check_https_working() {
    local domain=$1
    echo -e "${BLUE}Checking HTTPS response for ${domain}...${NC}"

    http_code=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "https://${domain}" 2>/dev/null)

    if [[ "$http_code" == "200" || "$http_code" == "301" || "$http_code" == "302" ]]; then
        echo -e "  ${GREEN}✓ HTTPS working (${http_code})${NC}"
        return 0
    else
        echo -e "  ${RED}✗ HTTPS not working (code: ${http_code})${NC}"
        return 1
    fi
}

check_dns() {
    local domain=$1
    echo -e "${BLUE}DNS lookup for ${domain}...${NC}"

    # Get A records
    a_records=$(dig +short A "$domain" 2>/dev/null)
    if [ -n "$a_records" ]; then
        echo -e "  ${GREEN}A Records:${NC}"
        echo "$a_records" | while read -r ip; do
            echo -e "    ${ip}"
        done
    else
        echo -e "  ${YELLOW}No A records found${NC}"
    fi

    # Get AAAA records (IPv6)
    aaaa_records=$(dig +short AAAA "$domain" 2>/dev/null)
    if [ -n "$aaaa_records" ]; then
        echo -e "  ${GREEN}AAAA Records (IPv6):${NC}"
        echo "$aaaa_records" | while read -r ip; do
            echo -e "    ${ip}"
        done
    fi

    # Get CNAME if exists
    cname=$(dig +short CNAME "$domain" 2>/dev/null)
    if [ -n "$cname" ]; then
        echo -e "  ${GREEN}CNAME:${NC} ${cname}"
    fi

    # Get nameservers
    ns_records=$(dig +short NS "$domain" 2>/dev/null)
    if [ -n "$ns_records" ]; then
        echo -e "  ${GREEN}Nameservers:${NC}"
        echo "$ns_records" | while read -r ns; do
            echo -e "    ${ns}"
        done
    fi
}

check_domain() {
    local domain=$1

    # Remove protocol if present
    domain=$(echo "$domain" | sed 's|https\?://||' | sed 's|/.*||')

    # Remove www. prefix if present (we'll add it back for www check)
    base_domain=$(echo "$domain" | sed 's/^www\.//')

    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Checking: ${base_domain}${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"

    # Check base domain
    echo ""
    echo -e "${YELLOW}--- ${base_domain} ---${NC}"
    check_dns "$base_domain"
    echo ""
    check_ssl "$base_domain"
    echo ""
    check_http_redirect "$base_domain"
    echo ""
    check_https_working "$base_domain"

    # Check www variant
    www_domain="www.${base_domain}"
    echo ""
    echo -e "${YELLOW}--- ${www_domain} ---${NC}"
    check_dns "$www_domain"
    echo ""
    check_ssl "$www_domain"
    echo ""
    check_http_redirect "$www_domain"
    echo ""
    check_https_working "$www_domain"
}

# Main script
if [ $# -eq 0 ]; then
    echo "Usage: $0 <domain1> [domain2] [domain3] ..."
    echo "   or: $0 -f <file_with_domains>"
    echo ""
    echo "Examples:"
    echo "  $0 example.com google.com"
    echo "  $0 -f domains.txt"
    exit 1
fi

# Check for required tools
for cmd in curl openssl dig; do
    if ! command -v "$cmd" &> /dev/null; then
        echo -e "${RED}Error: $cmd is required but not installed.${NC}"
        exit 1
    fi
done

domains=()

# Parse arguments
if [ "$1" == "-f" ]; then
    if [ -z "$2" ] || [ ! -f "$2" ]; then
        echo -e "${RED}Error: File not found or not specified${NC}"
        exit 1
    fi
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        domains+=("$line")
    done < "$2"
else
    domains=("$@")
fi

echo -e "${YELLOW}Domain Health Checker${NC}"
echo -e "${YELLOW}=====================${NC}"
echo "Checking ${#domains[@]} domain(s)..."

for domain in "${domains[@]}"; do
    check_domain "$domain"
done

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Check complete!${NC}"
