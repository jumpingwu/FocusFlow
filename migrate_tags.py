#!/usr/bin/env python3
"""
Migration script to update data.json to support the tags feature.

This script:
1. Creates a backup of data.json as data.json.migration.bak
2. Adds "tags": [] to the root level (after "categories")
3. Adds "tags": [] to each item (after "logs")
4. Writes the updated data back to data.json

Usage: python migrate_tags.py
"""

import json
import os
import sys
from pathlib import Path


def migrate_tags():
    """Migrate data.json to support tags feature."""

    # File paths
    project_root = Path(__file__).parent
    data_file = project_root / "data.json"
    backup_file = project_root / "data.json.migration.bak"

    print("=" * 60)
    print("Tags Feature Migration Script")
    print("=" * 60)

    # Check if data.json exists
    if not data_file.exists():
        print(f"❌ Error: {data_file} not found!")
        sys.exit(1)

    # Read the current data.json
    print(f"\n📖 Reading {data_file}...")
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Failed to parse JSON - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error reading file - {e}")
        sys.exit(1)

    # Create backup
    print(f"💾 Creating backup: {backup_file}")
    try:
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("✅ Backup created successfully")
    except Exception as e:
        print(f"❌ Error creating backup - {e}")
        sys.exit(1)

    # Track changes
    changes_made = False
    items_updated = 0

    # Check and add root-level tags array
    if "tags" not in data:
        print("\n📝 Adding 'tags' array to root level...")
        # Insert tags after categories
        ordered_data = {}
        for key in data:
            ordered_data[key] = data[key]
            if key == "categories":
                ordered_data["tags"] = []
        data = ordered_data
        changes_made = True
        print("✅ Root-level tags array added")
    else:
        print("\n✅ Root-level tags array already exists")

    # Check and add tags to each item
    if "items" in data and isinstance(data["items"], list):
        print(f"\n📝 Checking {len(data['items'])} items for tags field...")
        for i, item in enumerate(data["items"]):
            if isinstance(item, dict):
                if "tags" not in item:
                    # Add tags array after logs
                    ordered_item = {}
                    for key in item:
                        ordered_item[key] = item[key]
                        if key == "logs":
                            ordered_item["tags"] = []
                    data["items"][i] = ordered_item
                    items_updated += 1
                    changes_made = True

        if items_updated > 0:
            print(f"✅ Added tags to {items_updated} items")
        else:
            print("✅ All items already have tags field")
    else:
        print("\n⚠️  Warning: No items array found in data.json")

    # Write the updated data back to data.json
    if changes_made:
        print(f"\n💾 Writing updated data to {data_file}...")
        try:
            with open(data_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print("✅ Migration completed successfully!")
        except Exception as e:
            print(f"❌ Error writing file - {e}")
            print("⚠️  Attempting to restore from backup...")
            try:
                with open(backup_file, 'r', encoding='utf-8') as f:
                    backup_data = json.load(f)
                with open(data_file, 'w', encoding='utf-8') as f:
                    json.dump(backup_data, f, indent=2, ensure_ascii=False)
                print("✅ Backup restored successfully")
            except Exception as restore_error:
                print(f"❌ Failed to restore backup - {restore_error}")
                print(f"📁 Your data is in: {backup_file}")
            sys.exit(1)
    else:
        print("\n✅ No changes needed - data.json already has tags support")

    # Summary
    print("\n" + "=" * 60)
    print("Migration Summary")
    print("=" * 60)
    print(f"✅ Root-level tags: {'Added' if 'tags' in data else 'Already existed'}")
    print(f"✅ Items updated: {items_updated}")
    print(f"💾 Backup saved to: {backup_file}")
    print("=" * 60)
    print("\n🎉 Migration complete! You can now use the tags feature.")
    print("\nNote: If you need to revert, restore from:")
    print(f"  {backup_file}")


if __name__ == "__main__":
    migrate_tags()