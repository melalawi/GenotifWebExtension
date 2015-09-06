###################################################################
# jsonConverter.py
#
# Converts a parsed gene text file (gene_symb {tab} gene_id) into the
# JSON format.
#
# Written by Mohamed El-Alawi on 2015/09/06
###################################################################

import os
import sys

# Open source file, iterates through each line, converts the line into the JSON equivalent, writes to new file, repeat until done
def jsonify(textFileName):
	try:
		nextLine = None
		jsonFile = openJSONFile(textFileName)
		
		# If something's iffy with the jsonFile (ie unable to write to source directory), don't bother
		if jsonFile is not None:
		
			# Looping through lines and stuff
			# JSON is finicky in that every line should end with a comma unless it's the last one, so the reader reads one line ahead.
			with open(textFileName, 'r') as textFile:
				for line in textFile:
					if not nextLine == None:
						jsonFile.write(jsonifyGeneEntry(nextLine) + ',\n')
					nextLine = line
			
			# We are done, process last line and close the JSON file with a }
			jsonFile.write(jsonifyGeneEntry(nextLine) + '\n}')
			
			jsonFile.close()
			
	except IOError:
		print("Error in Argument 1: Invalid fileName.")

# Opens/Creates a new JSON file based on source file name (ie gene.txt -> gene.json)
def openJSONFile(fileName):
	newFile = None
	
	try:
		newFile = open(os.path.splitext(fileName)[0] + '.json', 'w')
		
		# Initialize the JSON file with an open brace
		newFile.write('{\n')
	except IOError:
		# If for some reason the file is unwritable, tell the user and close the file.
		print("Error: Unable to write to source directory. Perhaps something's up with write permissions.")
		
		newFile.close()
		newFile = None
	
	return newFile

# Splits string into two (tab character), then JSONifies the line by adding quotation marks and all that jazz
def jsonifyGeneEntry(textLine):
	geneData = textLine.split()
	
	#geneData[0] is set to lower case for case-insensitive matching
	return '\t"' + geneData[0].lower() + '":"' + geneData[1] + '"'

# Starts here. User must provide textFile as Argument 1
if len(sys.argv) < 2:
	print("Error in Argument 1: No file name provided.")
else:
	jsonify(sys.argv[1])