# LetsForm Schema Reference (Mantine Framework)
Version: 2.0
Framework: react-mantine
Purpose: AI-readable reference for JSON form generation

## CRITICAL RULES:

### Script Rules:
- Scripts MUST be single-line JSON strings (no \n characters)
- Can use single quotes ('') or double quotes ("") for the JSON string value
- JavaScript syntax (if/else blocks, functions, braces) is allowed within the string
- Use semicolons (;) to separate multiple JavaScript statements
- Scripts trigger when user types/changes the component value
- NEVER modify the same component without conditions (causes infinite loop)
- If modifying same component: add conditions like `if (!value || value === '')` or make it `readOnly`
- Common pattern: merge values from multiple fields into another field
- Must use valid fieldName if using helper functions. If verifying script make sure to check if its using valid fieldName

### Script Format Examples:

**VALID SCRIPTS:**
```javascript
// Simple conditional
"script": "if (fieldName) { enable('otherField'); } else { disable('otherField'); }"

// Multiple statements with semicolons
"script": "disable('loading'); yield(); const data = await fetch(url); enable('loading');"

// Complex nested logic
"script": "if (country === 'US') { if (state) { show('zipCode'); } else { hide('zipCode'); } }"

// Mixed quotes (single quotes for JSON string, double inside)
'script': 'if (name !== "") { setFieldValue("fullName", name + " " + surname); }'
```

**INVALID SCRIPTS:**
```javascript
// Multi-line strings (NOT SUPPORTED)
"script": `if (condition) {
  doSomething();
}`

// Line breaks in JSON string
"script": "if (condition) {\n  doSomething();\n}"
```

### JSON Rules:
- All Mantine-specific props go under "react-mantine" key
- "component" and "name" are required (except display components)
- Form data structure uses component names as keys

### Query Tool Rules:
- **ALWAYS use targeted queries** - avoid pulling entire schema unless absolutely necessary
- **MUST use selective field extraction** - NEVER query without explicitly specifying which fields to return. Always list the exact properties needed using bracket notation like `[name,component,label,hint]`
- **Start with discovery phase** using minimal token queries to understand structure
- **Use selective property extraction** - specify only needed properties with `[name,component,label]` syntax
- **Apply filters before selection** - use `[?(@.component)]` to filter before extracting properties
- **Chain queries strategically** - start narrow, expand only if needed
- **Use array slicing** for large datasets - `options[0:3]` to see structure without full data
- **Cache discovery results** - don't re-query basic structure repeatedly
- **Query by context** - use different patterns based on user's specific request:
  - Field modification → `$..[*][?(@.component && @.name=='TARGET_NAME')].[name,component,label,hint,placeholder,disabled,hidden]`
  - Script analysis → `$..[*][?(@.component && @.script)].[name,component,script]`
  - Validation review → `$..[*][?(@.component && (@.validation || @.required))].[name,component,required,validation]`
  - Dependency check → `$..[*][?(@.script && @.script.includes('FIELD_NAME'))].[name,component,script]`
- **Avoid wildcard selections** - never use `$..* ` or `$..[*].*` without filters
- **FORBIDDEN: Generic property extraction** - Never use queries ending with just `.*` or without field specification
- **Token optimization priority** - reduce context size by 60-80% through intelligent querying by requesting only essential fields

### Layout Component Query Rules:
- **NEVER query entire layout objects** - columns, groups, tabs, steps, arrays contain massive nested structures
- **Always use selective property extraction** for layouts - specify exactly what you need
- **Query layout containers separately** from their contents to avoid context bloat
- **When finding component locations** - identify parent layout type and field key
- **For layout modifications** - query structure first, then target specific paths
- **CRITICAL: Query layout component names FIRST** - `$..[*][?(@.component=='columns' || @.component=='group' || @.component=='tabs' || @.component=='steps')].[name,component]`
- **THEN query specific layout details:**
  - Columns: `$..[*][?(@.component=='columns' && @.name=='LAYOUT_NAME')].columns[*].name`
  - Tabs: `$..[*][?(@.component=='tabs' && @.name=='LAYOUT_NAME')].tabs[*].[value,label]`
  - Steps: `$..[*][?(@.component=='steps' && @.name=='LAYOUT_NAME')].tabs[*].[value,label]`
  - Group: `$..[*][?(@.component=='group' && @.name=='LAYOUT_NAME')].[label,collapsible]`
- **NEVER query multiple layout structures at once** - always filter by specific name first

### Layout Modification Rules:
- **Before adding to columns** - verify column exists: `$..[*][?(@.component=='columns' && @.name=='LAYOUT_NAME')].columns[*][?(@.name=='COLUMN_NAME')]`
- **When adding components** - always update both the component definition AND the parent layout's fields object
- **For column additions** - check column configuration first, then add to appropriate fields.COLUMN_NAME array
- **Never modify layout structure** without first querying current column/tab/step names
- **Always validate field key exists** in parent layout before adding components

### Performance Rules for Layouts:
- **Query layout metadata first**: `[name,component,columns]` or `[name,component,tabs]`
- **Then query specific field paths**: `fields.columnName[*].[name,component]`
- **Avoid deep wildcard queries** on layouts: Never use `$..[*].*` on layout objects
- **Use parent-child queries** instead of full tree traversal
- **Limit field extraction** when exploring: `fields.*..[0:3]` for sampling

### Name Property Rules:
- Component names MUST be unique across entire form (objects with both `name` and `component` properties)
- Other `name` fields (columns, options, etc.) only need local uniqueness within their context
- MUST follow variable naming: start with letter/underscore, contain only letters/numbers/underscores. Should Not contain special characters or spaces.
- Valid: "firstName", "user_email", "field1", "_temp"
- Invalid: "first-name", "user email", "123field", "my.field"
- Component names become keys in the form data JSON response - duplicates cause data loss
- Use `diagnose_letsform_schema` to get all invalid  and duplicates names in form
- **WHEN CREATING NEW COMPONENTS**: Choose descriptive, semantic names that reflect the field's purpose and data type. Use camelCase convention for consistency. Examples: "emailAddress" not "field1", "birthDate" not "date", "phoneNumber" not "phone", "shippingAddress" not "address2"
- **BEFORE RENAMING**: When renaming a field, check if it's referenced in scripts using targeted query: `$..[*][?(@.component && @.script && @.script.includes('OLD_FIELD_NAME'))].[name,script]` to find all scripts that reference the field name




## COMPONENT REFERENCE:

========== START: INPUT-TEXT ==========
Component: "input-text"
Type: input
Value: string (in form data)
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | field label
hint           | string  | opt  | help text below field
placeholder    | string  | opt  | ghost text when empty
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents editing
hidden         | bool    | opt  | hides from form
submitOnEnter  | bool    | opt  | Trigger onSubmit / onError if the user hits Enter key
inputMode      | enum    | opt  | none,text,decimal,numeric,tel,search,email,url
autocomplete   | string  | opt  | off,on,name,given-name,family-name,email,username,new-password,current-password,tel,address-line1,postal-code,cc-number,etc
inputType      | string  | opt  | text,password,email,number,tel,url,search,color,date,datetime-local,file,month,range,time,week

MANTINE:
size           | string  | sm   | Size of the field. Values: "xs", "sm", "md", "lg", "xl"
radius         | string  | opt  | Values: "xs", "sm", "md", "lg", "xl"
variant        | string  | opt  | Values: "default", "filled", "unstyled"
fullWidth      | boolean | f    | Set the width of the field to 100% of the enclosing container
width          | number  | opt  | Set the width (in pixel) of the field
leftSection    | string  | opt  |
rightSection   | string  | opt  |
leftSectionWidth  | number  | opt  |
rightSectionWidth | number  | opt  |
pointer        | boolean | opt  | Determines whether the input should have cursor: pointer style, false by default
withErrorStyles | boolean | opt  | Determines whether the input should have red border and red text color when the error prop is set, true by default

EXAMPLE:
{"component":"input-text","name":"email","label":"Email","react-mantine":{"fullWidth":true}}

SCRIPTS: all (enable,disable,show,hide,setValue,setParam,style)
VALIDATION: required,minLength,maxLength,pattern,validate
========== END: INPUT-TEXT ==========
========== START: INPUT-NUMBER ==========
Component: "input-number"
Type: input
Value: number (in form data)
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | field label
hint           | string  | opt  | help text below field
placeholder    | string  | opt  | ghost text when empty
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents editing
hidden         | bool    | opt  | hides from form

MANTINE:
size           | string  | sm   | "xs", "sm", "md", "lg", "xl"
radius         | string  | opt  | "xs", "sm", "md", "lg", "xl"
variant        | string  | opt  | "default", "filled", "unstyled"
min            | number  | opt  | Minimum value
max            | number  | opt  | Maximum value
step           | number  | opt  | Incremental value with the spin buttons
fullWidth      | boolean | f    | Set the width of the field to 100% of the enclosing container
width          | number  | opt  | Set the width (in pixel) of the field
leftSection    | string  | opt  |
rightSection   | string  | opt  |
leftSectionWidth  | number  | opt  |
rightSectionWidth | number  | opt  |
pointer        | boolean | opt  | Determines whether the input should have cursor: pointer style, false by default
withErrorStyles | boolean | opt  | Determines whether the input should have red border and red text color when the error prop is set, true by default
valueIsNumericString | boolean | opt  | If value is passed as string representation of numbers, false by default
hideControls   | boolean | opt  |
allowLeadingZeros | boolean | opt  |
allowNegative  | boolean | opt  |
clampBehavior  | string  | opt  | Controls value clamping. Values: "none", "blur", "strict"
startValue     | number  | opt  | Value when empty and increment/decrement used, 0 by default
allowDecimal   | boolean | opt  |
decimalSeparator | string | opt  | Character used as decimal separator, "." by default
fixedDecimalScale | boolean | opt  | Add 0s after decimal to match decimalScale, false by default
decimalScale   | number  | opt  | Limits digits after decimal point
thousandsGroupStyle | string | opt  | Values: "none", "thousand", "lakh", "wan"
thousandSeparator | string | opt  | Character used to separate thousands

EXAMPLE:
{"component":"input-number","name":"age","label":"Age","react-mantine":{"min":0,"max":120}}

SCRIPTS: all
VALIDATION: required,min,max,validate
========== END: INPUT-NUMBER ==========
========== START: CHECKBOX ==========
Component: "checkbox"
Type: input
Value: boolean (in form data)
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | checkbox label
hint           | string  | opt  | help text
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents changes
hidden         | bool    | opt  | hides from form

MANTINE:
size           | string  | sm   | "xs", "sm", "md", "lg", "xl"
radius         | string  | opt  | "xs", "sm", "md", "lg", "xl"
labelPosition  | string  | right| "left", "right"
color          | string  | opt  | "grey", "red", "pink", "grape", "violet", "indigo", "blue", "cyan", "teal", "green", "lime", "yellow", "orange"
iconColor      | string  | opt  | "grey", "red", "pink", "grape", "violet", "indigo", "blue", "cyan", "teal", "green", "lime", "yellow", "orange"
autoContrast   | boolean | opt  | Determines whether icon color with filled variant should depend on background-color
indeterminate  | boolean | opt  |

EXAMPLE:
{"component":"checkbox","name":"agree","label":"I agree to terms"}

SCRIPTS: all
VALIDATION: required
========== END: CHECKBOX ==========
========== START: SELECT ==========
Component: "select"
Type: input
Value: string (in form data)
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | field label
hint           | string  | opt  | help text
placeholder    | string  | opt  | placeholder text
options        | array   | req  | [{value:"",label:""}] Any additional key can be safely added to be used with filterKey and filterValue
showImageOptions| bool   | opt  | show images in options
filterKey      | string  | opt  | Object key in option object used for filtering
filterValue    | string  | opt  | Value used to filter the options (only options with equal to will be shown
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents changes
hidden         | bool    | opt  | hides from form

MANTINE:
size           | string  | sm   | xs,sm,md,lg,xl
radius         | string  | opt  | xs,sm,md,lg,xl
variant        | string  | opt  | default,filled,unstyled
fullWidth      | boolean | f    | Set the width of the field to 100% of the enclosing container
width          | number  | opt  | Set the width (in pixel) of the field
leftSection    | string  | opt  | Text or URL icon for the left section of the field
rightSection   | string  | opt  | Text or URL icon for the right section of the field
leftSectionWidth  | number  | opt  | Width of the left section of the field
rightSectionWidth | number  | opt  | Width of the right section of the field
withCheckIcon  | boolean | opt  | Determines whether check icon should be displayed near the selected option label, true by default
checkIconPosition | string | opt | left,right
allowDeselect  | boolean | opt  | Determines whether it should be possible to deselect value by clicking on the selected option, true by default
clearable      | boolean | f    | Determines whether the clear button should be displayed in the right section when the component has value
defaultDropdownOpened | boolean | opt | Uncontrolled dropdown initial opened state
withScrollArea | boolean | opt  | Determines whether the options should be wrapped with scroll bars, true by default
pointer        | boolean | opt  | Determines whether the input should have cursor: pointer style, false by default
withErrorStyles | boolean | opt | Determines whether the input should have red border and red text color when the error prop is set, true by default

EXAMPLE:
{"component":"select","name":"country","label":"Country","options":[{"value":"us","label":"United States"},{"value":"uk","label":"United Kingdom"}],"react-mantine":{"searchable":true}}

SCRIPTS: all
VALIDATION: required
========== END: SELECT ==========
========== START: TEXTAREA ==========
Component: "textarea"
Type: input
Value: string (in form data)
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | field label
hint           | string  | opt  | help text
placeholder    | string  | opt  | placeholder text
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents editing
hidden         | bool    | opt  | hides from form

MANTINE:
size           | string  | sm   | xs,sm,md,lg,xl
radius         | string  | opt  | xs,sm,md,lg,xl
variant        | string  | opt  | default,filled,unstyled
fullWidth      | boolean | f    | Set the width of the field to 100% of the enclosing container
width          | number  | opt  | Set the width (in pixel) of the field
autosize       | boolean | f    |
minRows        | number  | opt  |
maxRows        | number  | opt  | Max number of rows in auto-size mode
leftSection    | string  | opt  |
rightSection   | string  | opt  |
leftSectionWidth  | number  | opt  |
rightSectionWidth | number  | opt  |
pointer        | boolean | opt  | Determines whether the input should have cursor: pointer style, false by default
withErrorStyles | boolean | opt  | Determines whether the input should have red border and red text color when the error prop is set, true by default

EXAMPLE:
{"component":"textarea","name":"description","label":"Description","react-mantine":{"rows":5,"fullWidth":true}}

SCRIPTS: all
VALIDATION: required,minLength,maxLength,pattern,validate
========== END: TEXTAREA ==========
========== START: DATE ==========
Component: "date"
Type: input
Value: string (in form data, ISO-8601 format: "2024-03-15")
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | field label
hint           | string  | opt  | help text
placeholder    | string  | opt  | placeholder text
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents changes
hidden         | bool    | opt  | hides from form

MANTINE:
size           | string  | sm   | xs,sm,md,lg,xl
radius         | string  | opt  | xs,sm,md,lg,xl
variant        | string  | opt  | default,filled,unstyled
fullWidth      | boolean | f    | Set the width of the field to 100% of the enclosing container
width          | number  | opt  | Set the width (in pixel) of the field
valueFormat    | string  | opt  | Dayjs format to display input value, "MMMM D, YYYY" by default
firstDayOfWeek | string  | opt  | 0-6, 0=Sunday, 6=Saturday, defaults to 1=Monday
hideOutsideDates | boolean | f  | Hide dates outside current month
labelSeparator | string  | opt  | Separator between range value
dateType       | string  | opt  | default,range,multiple
dropdownType   | string  | opt  | modal,popover
allowDeselect  | boolean | opt  | Allow deselection by clicking selected date
clearable      | boolean | f    | Add clear button to right section
hideWeekdays   | boolean | f    | Hide weekdays row
defaultLevel   | string  | opt  | decade,month,year
hasNextLevel   | boolean | opt  | Enable next level button, true by default
maxLevel       | string  | opt  | decade,month,year
numberOfColumns | number | opt  | Number of columns to render
columnsToScroll | number | opt  | Number to scroll on next/prev clicks
minDate        | date    | opt  | Minimum selectable date
maxDate        | date    | opt  | Maximum selectable date
withCellSpacing | boolean | t   | Separate controls with spacing
pointer        | boolean | opt  | Add cursor:pointer style
withErrorStyles | boolean | opt | Add error styling when error prop is set
leftSection    | string  | opt  |
rightSection   | string  | opt  |
leftSectionWidth | number | opt |
rightSectionWidth | number | opt |

EXAMPLE:
{"component":"date","name":"birthDate","label":"Birth Date","react-mantine":{"clearable":true}}

SCRIPTS: all
VALIDATION: required
========== END: DATE ==========
========== START: DATETIME ==========
Component: "datetime"
Type: input
Value: string (in form data, ISO format: "2023-05-12T22:14:49.116Z")
Parent: * (any)
Children: none

DESCRIPTION: The Datetime datetime component handles timestamps value, it accepts date + time values in ISO format (i.e., “2023-05-12T22:14:49.116Z”) or JavaScript Date() object. The value returned by this component is always in ISO format.

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | field label
hint           | string  | opt  | help text
placeholder    | string  | opt  | placeholder text
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents changes
hidden         | bool    | opt  | hides from form

MANTINE:
size           | string  | sm   | xs,sm,md,lg,xl
radius         | string  | opt  | xs,sm,md,lg,xl
variant        | string  | opt  | default,filled,unstyled
valueFormat    | string  | opt  | Dayjs format, "DD/MM/YYYY HH:mm" by default
firstDayOfWeek | string  | opt  | 0-6, 0=Sunday, 6=Saturday, defaults to 1=Monday
hideOutsideDates | boolean | f  | Hide dates outside current month
labelSeparator | string  | opt  | Separator between range value
fullWidth      | boolean | f    | Set the width of the field to 100% of container
width          | number  | opt  | Set the width (in pixel) of the field
withSeconds    | boolean | opt  |
dropdownType   | string  | opt  | modal,popover
allowDeselect  | boolean | opt  | Allow deselection by clicking selected date
clearable      | boolean | f    | Add clear button to right section
hideWeekdays   | boolean | f    | Hide weekdays row
defaultLevel   | string  | opt  | decade,month,year
hasNextLevel   | boolean | opt  | Enable next level button, true by default
maxLevel       | string  | opt  | decade,month,year
numberOfColumns | number | opt  | Number of columns to render
columnsToScroll | number | opt  | Number to scroll on next/prev clicks
minDate        | date    | opt  | Minimum selectable date
maxDate        | date    | opt  | Maximum selectable date
withCellSpacing | boolean | t   | Separate controls with spacing
pointer        | boolean | opt  | Add cursor:pointer style
withErrorStyles | boolean | opt | Add error styling when error prop is set
leftSection    | string  | opt  |
rightSection   | string  | opt  |
leftSectionWidth | number | opt |
rightSectionWidth | number | opt |

EXAMPLE:
{"component":"datetime","name":"appointment","label":"Appointment Time","react-mantine":{"clearable":true}}

SCRIPTS: all
VALIDATION: required
========== END: DATETIME ==========
========== START: TIME ==========
Component: "time"
Type: input
Value: string (in form data, format: "hh:mm:ss")
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | field label
hint           | string  | opt  | help text
placeholder    | string  | opt  | placeholder text
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents changes
hidden         | bool    | opt  | hides from form

MANTINE:
size           | string  | sm   | xs,sm,md,lg,xl
radius         | string  | opt  | xs,sm,md,lg,xl
variant        | string  | opt  | default,filled,unstyled
fullWidth      | boolean | f    | Set the width of the field to 100% of the enclosing container
width          | number  | opt  | Set the width (in pixel) of the field
minTime        | string  | opt  |
maxTime        | string  | opt  |
withSeconds    | boolean | opt  | Determines whether seconds input should be rendered
pointer        | boolean | opt  | Determines whether the input should have cursor: pointer style, false by default
showBrowserPicker | boolean | opt | Show browser native picker (if supported)
leftSection    | string  | opt  |
rightSection   | string  | opt  |
leftSectionWidth | number | opt |
rightSectionWidth | number | opt |

EXAMPLE:
{"component":"time","name":"startTime","label":"Start Time","react-mantine":{"withSeconds":false}}

SCRIPTS: all
VALIDATION: required
========== END: TIME ==========
========== START: RADIO-GROUP ==========
Component: "radio-group"
Type: input
Value: string (in form data)
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | field label
hint           | string  | opt  | help text
options        | array   | req  | [{value:"",label:""}]
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents changes
hidden         | bool    | opt  | hides from form

MANTINE:
size           | string  | sm   | xs,sm,md,lg,xl
radius         | string  | opt  | xs,sm,md,lg,xl
orientation    | string  | vert | horizontal,vertical
spacing        | string  | sm   | xs,sm,md,lg,xl
labelPosition  | string  | opt  | left,right
color          | string  | opt  | grey,red,pink,grape,violet,indigo,blue,cyan,teal,green,lime,yellow,orange
iconColor      | string  | opt  | grey,red,pink,grape,violet,indigo,blue,cyan,teal,green,lime,yellow,orange
autoContrast   | boolean | opt  | Determines whether icon color with filled variant should depend on background-color

EXAMPLE:
{"component":"radio-group","name":"gender","label":"Gender","options":[{"value":"m","label":"Male"},{"value":"f","label":"Female"},{"value":"o","label":"Other"}]}

SCRIPTS: all
VALIDATION: required
========== END: RADIO-GROUP ==========
========== START: CHECKBOX-GROUP ==========
Component: "checkbox-group"
Type: input
Value: array of strings (in form data)
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | field label
hint           | string  | opt  | help text
options        | array   | req  | [{value:"",label:""}]
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents changes
hidden         | bool    | opt  | hides from form

MANTINE:
size           | string  | sm   | xs,sm,md,lg,xl
radius         | string  | opt  | xs,sm,md,lg,xl
orientation    | string  | vert | horizontal,vertical
spacing        | string  | sm   | xs,sm,md,lg,xl
labelPosition  | string  | opt  | left,right
color          | string  | opt  | grey,red,pink,grape,violet,indigo,blue,cyan,teal,green,lime,yellow,orange
iconColor      | string  | opt  | grey,red,pink,grape,violet,indigo,blue,cyan,teal,green,lime,yellow,orange
autoContrast   | boolean | opt  | Determines whether icon color with filled variant should depend on background-color

EXAMPLE:
{"component":"checkbox-group","name":"interests","label":"Interests","options":[{"value":"sports","label":"Sports"},{"value":"music","label":"Music"},{"value":"art","label":"Art"}]}

SCRIPTS: all
VALIDATION: required,minLength,maxLength
========== END: CHECKBOX-GROUP ==========
========== START: TOGGLE ==========
Component: "toggle"
Type: input
Value: boolean (in form data)
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | toggle label
hint           | string  | opt  | help text
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents changes
hidden         | bool    | opt  | hides from form

MANTINE:
size           | enum    | sm   | xs,sm,md,lg,xl
color          | string  | opt  | theme color
radius         | string  | opt  | xs,sm,md,lg,xl
labelPosition  | enum    | right| left,right
onLabel        | string  | opt  | label when on
offLabel       | string  | opt  | label when off

EXAMPLE:
{"component":"toggle","name":"notifications","label":"Enable Notifications"}

SCRIPTS: all
VALIDATION: required
========== END: TOGGLE ==========
========== START: MULTISELECT ==========
Component: "multiselect"
Type: input
Value: array of strings (in form data)
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | field label
hint           | string  | opt  | help text
placeholder    | string  | opt  | placeholder text
options        | array   | req  | [{value:"",label:""}]
filterKey      | string  | opt  | key for filtering options
filterValue    | string  | opt  | value to filter by
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents changes
hidden         | bool    | opt  | hides from form

MANTINE:
size           | string  | sm   | Size of the field. Values: "xs", "sm", "md", "lg", "xl"
radius         | string  | opt  | Values: "xs", "sm", "md", "lg", "xl"
variant        | string  | opt  | Values: "default", "filled", "unstyled"
fullWidth      | boolean | f    | Set the width of the field to 100% of the enclosing container
width          | number  | opt  | Set the width (in pixel) of the field
leftSection    | string  | opt  |
rightSection   | string  | opt  |
leftSectionWidth  | number  | opt  |
rightSectionWidth | number  | opt  |
limit          | number  | opt  | Maximum number of options displayed at a time, Infinity by default
maxDropdownHeight | number | opt | max-height of the dropdown, only applicable when withScrollArea prop is true, 250 by default
maxValues      | number  | opt  | Maximum number of values, Infinity by default
searchable     | boolean | f    | Determines whether the select should be searchable, false by default
nothingFoundMessage | string | opt | Message displayed when no option matched current search query, only applicable when searchable prop is set
clearable      | boolean | f    | Determines whether the clear button should be displayed in the right section when the component has value
defaultDropdownOpened | boolean | opt | Uncontrolled dropdown initial opened state
hidePickedOptions | boolean | f  | Determines whether picked options should be removed from the options list
pointer        | boolean | opt  | Determines whether the input should have cursor: pointer style, false by default
selectFirstOptionOnChange | boolean | opt | Determines whether the first option should be selected when value changes, false by default
withCheckIcon  | boolean | t    | Determines whether check icon should be displayed near the selected option label
withErrorStyles | boolean | opt | Determines whether the input should have red border and red text color when the error prop is set, true by default
withScrollArea | boolean | t    | Determines whether the options should be wrapped with scroll bars

EXAMPLE:
{"component":"multiselect","name":"skills","label":"Skills","options":[{"value":"js","label":"JavaScript"},{"value":"py","label":"Python"},{"value":"java","label":"Java"}],"react-mantine":{"searchable":true}}

SCRIPTS: all
VALIDATION: required,minLength,maxLength
========== END: MULTISELECT ==========
========== START: SLIDER ==========
Component: "slider"
Type: input
Value: number (in form data)
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | field label
hint           | string  | opt  | help text
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents changes
hidden         | bool    | opt  | hides from form

MANTINE:
size           | string  | sm   | Size of the field. Values: "xs", "sm", "md", "lg", "xl"
color          | string  | opt  | Values: "grey", "red", "pink", "grape", "violet", "indigo", "blue", "cyan", "teal", "green", "lime", "yellow", "orange"
radius         | string  | opt  | Values: "xs", "sm", "md", "lg", "xl"
min            | number  | 0    | Minimum value
max            | number  | 100  | Maximum value
step           | number  | 1    | Increment step
marks          | array   | opt  | Customize labels on the render ruler
precision      | number  | opt  | Number of significant digits after the decimal point
inverted       | boolean | f    | Determines whether track value representation should be inverted
labelAlwaysOn  | boolean | f    | Determines whether the label should be visible when the slider is not being dragged or hovered
showLabelOnHover| boolean| t    | Determines whether the label should be displayed when the slider is hovered

EXAMPLE:
{"component":"slider","name":"volume","label":"Volume","react-mantine":{"min":0,"max":100,"step":5}}

SCRIPTS: all
VALIDATION: required,min,max
========== END: SLIDER ==========
========== START: RATE ==========
Component: "rate"
Type: input
Value: number (in form data)
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | field label
hint           | string  | opt  | help text
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents changes
hidden         | bool    | opt  | hides from form

MANTINE:
size           | string  | sm   | xs,sm,md,lg,xl
color          | string  | opt  | grey,red,pink,grape,violet,indigo,blue,cyan,teal,green,lime,yellow,orange
count          | number  | 5    | Number of controls
fractions      | number  | 1    | Number of fractions each item can be divided into
highlightSelectedOnly | boolean | f | If set, only the selected symbol changes to full symbol when selected

EXAMPLE:
{"component":"rate","name":"rating","label":"Rate this product","react-mantine":{"count":5,"fractions":2}}

SCRIPTS: all
VALIDATION: required,min,max
========== END: RATE ==========
========== START: CURRENCY ==========
Component: "currency"
Type: input
Value: number (in form data)
Parent: * (any)
Children: none

DESCRIPTION: The format of the currency depends on the selected currency param (i.e. the currency symbol) and the form locale (i.e. the thousands and decimal separators and the position of currency symbol). Unless explicitly specified the form locale, by default, is the browser’s one.

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | field label
hint           | string  | opt  | help text
placeholder    | string  | opt  | placeholder text
currency       | string  | req  | ISO currency code (USD,EUR,GBP,etc)
disabled       | bool    | opt  | greys out field
readOnly       | bool    | opt  | prevents editing
hidden         | bool    | opt  | hides from form
currency       | string  | req  | Three letters ISO for currency. Values: "AFN", "ALL", "DZD", "ARS", "AMD", "AUD", "AZN", "BHD", "BDT", "BYN", "BZD", "BOB", "BAM", "BWP", "BRL", "GBP", "BND", "BGN", "BIF", "XOF", "XAF", "KHR", "CAD", "CVE", "CLP", "CNY", "COP", "KMF", "CDF", "CRC", "HRK", "CZK", "DKK", "DJF", "DOP", "EGP", "ERN", "EEK", "ETB", "EUR", "GEL", "GHS", "GTQ", "GNF", "HNL", "HKD", "HUF", "ISK", "INR", "IDR", "IRR", "IQD", "ILS", "JMD", "JPY", "JOD", "KZT", "KES", "KWD", "LVL", "LBP", "LYD", "LTL", "MOP", "MKD", "MGA", "MYR", "MUR", "MXN", "MDL", "MAD", "MZN", "MMK", "NAD", "NPR", "TWD", "NZD", "NIO", "NGN", "NOK", "OMR", "PKR", "PAB", "PYG", "PEN", "PHP", "PLN", "QAR", "RON", "RUB", "RWF", "SAR", "RSD", "SGD", "SOS", "ZAR", "KRW", "LKR", "SDG", "SEK", "CHF", "SYP", "TZS", "THB", "TOP", "TTD", "TND", "TRY", "USD", "UGX", "UAH", "AED", "UYU", "UZS", "VEF", "VND", "YER", "ZMK", "ZWL"

MANTINE:
size           | string  | sm   | "xs", "sm", "md", "lg", "xl"
radius         | string  | opt  | "xs", "sm", "md", "lg", "xl"
variant        | string  | opt  | "default", "filled", "unstyled"
fullWidth      | boolean | f    | Set the width of the field to 100% of the enclosing container
width          | number  | opt  | Set the width (in pixel) of the field
leftSection    | string  | opt  |
rightSection   | string  | opt  |
leftSectionWidth  | number  | opt  |
rightSectionWidth | number  | opt  |
pointer        | boolean | opt  | Determines whether the input should have cursor: pointer style, false by default
withErrorStyles | boolean | opt  | Determines whether the input should have red border and red text color when the error prop is set, true by default

EXAMPLE:
{"component":"currency","name":"price","label":"Price","currency":"USD","react-mantine":{"precision":2}}

SCRIPTS: all
VALIDATION: required,min,max
========== END: CURRENCY ==========
========== START: BUTTON ==========
Component: "button"
Type: input
Value: boolean (toggle) or null (link)
Parent: * (any)
Children: none

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
buttonType     | string  | req  | Type of button: toggle 2-states button or link button. "toggle", "link"
labelOn        | string  | opt  | label when toggled on (toggle type)
iconOn         | string  | opt  | icon when on (toggle type)
labelOff       | string  | opt  | label when toggled off (toggle type)
iconOff        | string  | opt  | icon when off (toggle type)
initialValue   | bool    | opt  | initial state (toggle type)
labelLink      | string  | opt  | button text (link type)
iconLink       | string  | opt  | icon (link type)
href           | string  | opt  | URL (link type)
hint           | string  | opt  | tooltip text
fullWidth      | bool    | opt  | Set the width of the field to 100% of the enclosing container
width          | number  | opt  | Set the width (in pixel) of the field
hidden         | bool    | opt  | hides from form

MANTINE:
fullWidth      | boolean | f    | expand to 100% width
size           | string  | sm   | xs,sm,md,lg,xl
variant        | string  | filled| filled,light,outline,subtle
color          | string  | opt  | grey,red,pink,grape,violet,indigo,blue,cyan,teal,green,lime,yellow,orange

EXAMPLE:
{"component":"button","name":"toggleEdit","buttonType":"toggle","labelOn":"Editing","labelOff":"View Only","initialValue":false}

SCRIPTS: all
VALIDATION: none
========== END: BUTTON ==========
========== START: HIDDEN ==========
Component: "hidden"
Type: input
Value: any (carries value without display)
Parent: * (any)
Children: none

DESCRIPTION: The Hidden hidden field it’s mainly used to carry an arbitrary value in the form payload without actually showing anything in the form.A possible use case is an adavanced validation using JavaScript and external variables

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)

MANTINE: none

EXAMPLE:
{"component":"hidden","name":"userId"}

SCRIPTS: setValue only
VALIDATION: all validation types supported
========== END: HIDDEN ==========
========== START: PLACEHOLDER ==========
Component: "placeholder"
Type: display
Value: none (display only)
Parent: * (any)
Children: none

PROPS:
name           | string  | opt  | identifier (for scripting)
label          | string  | opt  | heading text
text           | string  | req  | markdown formatted content
hint           | string  | opt  | additional help text
hidden         | bool    | opt  | hides from form

MANTINE:

EXAMPLE:
{"component":"placeholder","name":"info","text":"Please read the **terms** before proceeding. _All fields are required._"}

SCRIPTS: setValue (text, label), show, hide
VALIDATION: none
========== END: PLACEHOLDER ==========
========== START: PLACEHOLDER-IMAGE ==========
Component: "placeholder-image"
Type: display
Value: none (display only)
Parent: * (any)
Children: none

PROPS:
name           | string  | opt  | identifier (for scripting)
url            | string  | req  | image URL
align          | enum    | center| left,center,right
hidden         | bool    | opt  | hides from form

MANTINE:
maxWidth       | number  | opt  | Max width in pixel of the image
maxHeight      | number  | opt  | Max height in pixel of the image
marginTop      | number  | opt  | Margin in pixel from the top
marginBottom   | number  | opt  | Margin in pixel from the bottom

EXAMPLE:
{"component":"placeholder-image","name":"logo","url":"https://example.com/logo.png","react-mantine":{"maxWidth":200,"maxHeight":100}}

SCRIPTS: setValue (url), show, hide
VALIDATION: none
========== END: PLACEHOLDER-IMAGE ==========
========== START: GROUP ==========
Component: "group"
Type: layout
Value: none (container only)
Parent: * (any)
Children: * (any component)
DESCRIPTION: The Group group is a layout and collapsible field that can contain one or more fields or layout components like Group, Columns, Array, Tabs or Steps.

PROPS:
name           | string  | opt  | identifier (for scripting)
label          | string  | opt  | group heading
hidden         | bool    | opt  | hides entire group
collapsible    | bool    | f    | allow collapse/expand
open           | bool    | t    | initial state if collapsible
align          | enum    | left | left,center,right
border         | enum    | opt  | top,bottom,topBottom,boxed
fields         | array   | req  | Array of fields to be rendered inside the group

MANTINE:
spacing        | enum    | md   | xs,sm,md,lg,xl
p             | string  | opt  | padding (xs,sm,md,lg,xl)

FIELDS:
fields         | array   | req  | array of component objects

EXAMPLE:
{"component":"group","name":"addressGroup","label":"Address Information","collapsible":true,"fields":[{"component":"input-text","name":"street","label":"Street"}]}

SCRIPTS: show, hide only
VALIDATION: none
========== END: GROUP ==========
========== START: COLUMNS ==========
Component: "columns"
Type: layout
Value: none (container only)
Parent: * (any)
Children: * (any component)

PROPS:
name           | string  | opt  | identifier (for scripting)
columns        | array   | req  | [{name:"col1",size:1},{name:"col2",size:2}]
hidden         | bool    | opt  | hides entire layout
fields         | object  | req  | {"col1":[components],"col2":[components]}

COLUMN PROPS:
name           | string  | req  | Name or id of the column, the same name must be present as a key in the fields property
size           | number  | 1    | Flex-like size of the column (a column with size 2 will occupy twice the space of a column with size 1)
alignment      | string  | opt  | auto,baseline,center,end,flex-end,flex-start,inherit,initial,normal,revert,self-end,self-start,start,stretch,unset
hidden         | bool    | f    | Hide the column. Default: false

MANTINE:
gutter         | enum    | md   | xs,sm,md,lg,xl
grow           | bool    | f    | columns grow to fill


EXAMPLE:
{"component":"columns","name":"twoCol","columns":[{"name":"left","size":1},{"name":"right","size":1}],"fields":{"left":[{"component":"input-text","name":"firstName","label":"First Name"}],"right":[{"component":"input-text","name":"lastName","label":"Last Name"}]}}

SCRIPTS: show, hide only
VALIDATION: none
========== END: COLUMNS ==========
========== START: ARRAY ==========
Component: "array"
Type: layout
Value: array of objects (each object contains field values)
Parent: * (any)
Children: * (any component)

PROPS:
name           | string  | req  | unique identifier (must be unique, follow variable naming)
label          | string  | opt  | array heading
hint           | string  | opt  | help text below field
disabled       | bool    | opt  | disables and greys out field
readOnly       | bool    | opt  | prevents changes
hidden         | bool    | opt  | hides from form
align          | enum    | bottom| top,center,bottom (vertical alignment of add/remove buttons)
alignOffset    | number  | opt  | offset of add/remove button from top/bottom (depends on alignment)
arrayType      | enum    | arrayOfObject| arrayOfObject,arrayOfString,commaSeparated (defines result format, string/comma only applies if single field)
fields         | array   | req  | array of component objects (template)

MANTINE:
minItems       | number  | opt  | minimum array items
maxItems       | number  | opt  | maximum array items
addButtonLabel | string  | opt  | add button text
removeButtonLabel| string| opt  | remove button text

FIELDS:


EXAMPLE:
{"component":"array","name":"contacts","label":"Emergency Contacts","fields":[{"component":"input-text","name":"name","label":"Name"},{"component":"input-text","name":"phone","label":"Phone"}]}

SCRIPTS: arraySetParam only
VALIDATION: required,minLength,maxLength
========== END: ARRAY ==========
========== START: TABS ==========
Component: "tabs"
Type: layout
Value: none (container only)
Parent: * (any)
Children: * (any component)

PROPS:
name           | string  | opt  | identifier (for scripting)
tabs           | array   | req  | [{value:"tab1",label:"Tab 1"}]
hidden         | bool    | opt  | hides entire component

TAB PROPS:
value          | string  | req  | tab identifier
label          | string  | req  | tab display text

MANTINE:
color          | string  | opt  | grey,red,pink,grape,violet,indigo,blue,cyan,teal,green,lime,yellow,orange
variant        | string  | default| default,outline,pills
radius         | string  | opt  | xs,sm,md,lg,xl
grow           | boolean | f    | Determines whether tabs should take all available space
justify        | string  | opt  | flex-start,center,flex-end,space-between
orientation    | string  | horiz| horizontal,vertical
placement      | string  | opt  | left,right
activateTabWithKeyboard | boolean | t | Determines whether tab should be activated with arrow key press
allowTabDeactivation | boolean | f | Determines whether tab can be deactivated
autoContrast   | boolean | opt  | Determines whether icon color with filled variant should depend on background-color
inverted       | boolean | f    | Determines whether tabs should have inverted styles
keepMounted    | boolean | t    | If set to false, Tabs.Panel content will be unmounted when the associated tab is not active
loop           | boolean | t    | Determines whether arrow key presses should loop though items
defaultValue   | string  | opt  | initially active tab value

FIELDS:
fields         | object  | req  | {"tab1":[components],"tab2":[components]}

EXAMPLE:
{"component":"tabs","name":"userTabs","tabs":[{"value":"personal","label":"Personal"},{"value":"work","label":"Work"}],"fields":{"personal":[{"component":"input-text","name":"name","label":"Name"}],"work":[{"component":"input-text","name":"company","label":"Company"}]}}

SCRIPTS: show, hide only
VALIDATION: none
========== END: TABS ==========
========== START: STEPS ==========
Component: "steps"
Type: layout
Value: none (container only)
Parent: * (any)
Children: * (any component)

PROPS:
name           | string  | opt  | identifier (for scripting)
tabs           | array   | req  | [{value:"step1",label:"Step 1"}]
hidden         | bool    | opt  | hides entire component
labelNext      | string  | opt  | next button text
labelPrevious  | string  | opt  | previous button text
align          | enum    | right| left,center,right (button alignment)

STEP PROPS:
value          | string  | req  | step identifier
label          | string  | req  | step display text

MANTINE:
color          | string  | opt  | grey,red,pink,grape,violet,indigo,blue,cyan,teal,green,lime,yellow,orange
radius         | string  | opt  | xs,sm,md,lg,xl
size           | string  | sm   | xs,sm,md,lg,xl
iconPosition   | string  | left | left,right
iconSize       | number  | opt  | Icon size in pixels
wrap           | boolean | t    | Determines whether steps should wrap to the next line if no space is available
allowStepClick | boolean | opt  | Set to false to disable clicks on step
allowStepSelect| boolean | t    | Should step selection be allowed
autoContrast   | boolean | opt  | Determines whether icon color with filled variant should depend on background-color

FIELDS:
fields         | object  | req  | {"step1":[components],"step2":[components]}

EXAMPLE:
{"component":"steps","name":"wizard","tabs":[{"value":"info","label":"Basic Info"},{"value":"details","label":"Details"}],"labelNext":"Continue","labelPrevious":"Back","fields":{"info":[{"component":"input-text","name":"name","label":"Name"}],"details":[{"component":"textarea","name":"bio","label":"Biography"}]}}

SCRIPTS: show, hide only
VALIDATION: none
========== END: STEPS ==========
========== START: DIVIDER ==========
Component: "divider"
Type: display
Value: none (display only)
Parent: * (any)
Children: none

PROPS:
name           | string  | opt  | identifier (for scripting)
size           | number  | 1    | thickness in pixels
color          | string  | opt  | divider color (#999999)
hidden         | bool    | opt  | hides divider

MANTINE:

label          | string  | opt  | text in divider
labelPosition  | enum    | center| left,center,right

EXAMPLE:
{"component":"divider","name":"section1","size":2,"color":"#cccccc","react-mantine":{"label":"OR"}}

SCRIPTS: show, hide only
VALIDATION: none
========== END: DIVIDER ==========
========== START: TWO-COLUMNS (DEPRECATED) ==========
Component: "two-columns"
Type: layout
Value: none (container only)
Parent: * (any)
Children: * (any component)

NOTE: DEPRECATED - Automatically converted to "columns" component

PROPS:
name           | string  | req  | The name of the field and the key of the JSON
layout         | string  | opt  | layout-1-1,layout-1-2,layout-1-3,layout-1-4,layout-2-1,layout-3-1,layout-4-1,layout-2-3,layout-3-2,layout-0-1,layout-1-0
leftAlignment  | string  | opt  | auto,baseline,center,end,flex-end,flex-start,inherit,initial,normal,revert,self-end,self-start,start,stretch,unset
rightAlignment | string  | opt  | auto,baseline,center,end,flex-end,flex-start,inherit,initial,normal,revert,self-end,self-start,start,stretch,unset
hidden         | boolean | opt  | Hides the layout component and all components inside it

FIELDS:
leftFields     | array   | req  | components for left column
rightFields    | array   | req  | components for right column

CONVERSION: Automatically converts to columns component with appropriate size ratios
========== END: TWO-COLUMNS (DEPRECATED) ==========
========== START: THREE-COLUMNS (DEPRECATED) ==========
Component: "three-columns"
Type: layout
Value: none (container only)
Parent: * (any)
Children: * (any component)

NOTE: DEPRECATED - Automatically converted to "columns" component

PROPS:
name           | string  | opt  | identifier
layout         | enum    | 1-1-1| various layout ratios
leftAlignment  | enum    | opt  | alignment for left column
centerAlignment| enum    | opt  | alignment for center column
rightAlignment | enum    | opt  | alignment for right column
hidden         | bool    | opt  | hides layout

FIELDS:
leftFields     | array   | req  | components for left column
centerFields   | array   | req  | components for center column
rightFields    | array   | req  | components for right column

CONVERSION: Automatically converts to columns component with appropriate size ratios
========== END: THREE-COLUMNS (DEPRECATED) ==========
## SCRIPT FUNCTIONS REFERENCE

### Script Execution Rules:
- Scripts execute when the component value changes (user types/selects)
- Use semicolons to separate statements
- Scripts have access to all field values as read-only variables **using their field names**
- **IMPORTANT**: Access current field's value using its field name, NOT `value` variable
- Scripts can modify other fields but avoid modifying self (infinite loop)
- Use yield() to apply changes immediately within script

========== START: SCRIPT FUNCTIONS ==========

setValue(fieldName, propertyName, value)
DEPRECATED - use setParam()

---

setParam(fieldName, propertyName, value)
PURPOSE: Change any property of a field
PARAMS:
- fieldName: string - target field name
- propertyName: string - property to change (hint, label, placeholder, etc)
- value: any - new value
EXAMPLE: setParam('email', 'hint', 'Enter work email'); setParam('age', 'required', true);

---

setFieldValue(fieldName, value)
PURPOSE: Set the actual value of a field (triggers re-render)
PARAMS:
- fieldName: string - target field name
- value: any - new field value
EXAMPLE: setFieldValue('fullName', firstName + ' ' + lastName);

---

arraySetParam(arrayFieldName, fieldName, propertyName, value)
PURPOSE: Change property of a field inside an array component
PARAMS:
- arrayFieldName: string - array component name
- fieldName: string - field name inside array
- propertyName: string - property to change
- value: any - new value
EXAMPLE: arraySetParam('contacts', 'phone', 'required', true);

---

enable(fieldName)
PURPOSE: Enable a disabled field
PARAMS:
- fieldName: string - target field name
EXAMPLE: if (hasLicense) { enable('licenseNumber'); }

---

disable(fieldName)
PURPOSE: Disable a field
PARAMS:
- fieldName: string - target field name
EXAMPLE: if (!needsShipping) { disable('shippingAddress'); }

---

show(fieldName)
PURPOSE: Show a hidden field
PARAMS:
- fieldName: string - target field name
EXAMPLE: if (isOther) { show('otherDetails'); }

---

hide(fieldName)
PURPOSE: Hide a field
PARAMS:
- fieldName: string - target field name
EXAMPLE: if (country !== 'US') { hide('stateField'); }

---

toggle(fieldName, propertyName)
PURPOSE: Toggle a boolean property
PARAMS:
- fieldName: string - target field name
- propertyName: string - boolean property name
EXAMPLE: toggle('advancedOptions', 'hidden');

---

style(fieldName, cssProperty, value) | style(fieldName, cssObject)
PURPOSE: Apply CSS styles to field container
PARAMS:
- fieldName: string - target field name
- cssProperty: string - CSS property name OR cssObject: object - multiple styles
- value: string - CSS value (if using single property)
EXAMPLE: style('warning', 'backgroundColor', '#fff3cd'); style('panel', {padding: '20px', border: '1px solid #ccc'});

---

css(selector, cssObject)
PURPOSE: Apply CSS to elements inside field container
PARAMS:
- selector: string - CSS selector
- cssObject: object - CSS properties
EXAMPLE: css('.hint p', {color: 'red', fontWeight: 'bold'});

---

element(fieldName)
PURPOSE: Get DOM element of field container
PARAMS:
- fieldName: string - target field name
RETURNS: DOM element
EXAMPLE: element('myField').classList.add('highlight');

---

context(key)
PURPOSE: Get value from form context
PARAMS:
- key: string - context key
RETURNS: any - context value
EXAMPLE: const apiUrl = context('apiEndpoint');

---

yield()
PURPOSE: Apply all pending changes immediately
PARAMS: none
EXAMPLE: disable('loading'); yield(); const data = await fetch(url); enable('loading');

---

**FIELD VALUE ACCESS:**
All field values are available as read-only variables using their names
**NOTE**: Unlike validation functions, scripts do NOT have a `value` variable for current field
EXAMPLE: if (age >= 18) { show('adultOptions'); }
         if (firstName && lastName) { setFieldValue('fullName', firstName + ' ' + lastName); }
         // For checkbox 'agree': if (agree) { enable('submitButton'); }

---

**values**
PURPOSE: Object containing all current form values
TYPE: read-only object
EXAMPLE: if (values.country === 'US' && values.state) { enable('zipCode'); }
**NOTE**: Alternative to direct field name access - both `fieldName` and `values.fieldName` work

========== END: SCRIPT FUNCTIONS ==========

### Common Script Patterns:

1. CASCADING FIELDS:
"script": "if (country) { const states = getStatesByCountry(country); setParam('state', 'options', states); enable('state'); } else { disable('state'); }"

2. CALCULATED FIELDS:
"script": "if (price && quantity) { setFieldValue('total', price * quantity); }"

3. CONDITIONAL VISIBILITY:
"script": "if (hasChildren) { show('childrenSection'); } else { hide('childrenSection'); setFieldValue('numberOfChildren', 0); }"

4. FIELD VALIDATION HINTS:
"script": "if (password) { const strength = password.length < 8 ? 'Weak' : 'Strong'; setParam('password', 'hint', 'Password strength: ' + strength); }"

5. PREVENTING INFINITE LOOPS:
"script": "if (!fullName || fullName === '') { setFieldValue('fullName', firstName + ' ' + lastName); }"

## VALIDATION REFERENCE

### Validation Execution:
- Validation runs based on mode: onSubmit (default), onChange, onBlur, or all
- Required validation runs first, then validation object rules
- Custom JavaScript validation runs last
- Validation errors trigger onError callback with error object

========== START: VALIDATION RULES ==========

VALIDATION MODES:
onSubmit       | default | Validate only when form submitted
onChange       | opt     | Validate on every field change (performance impact)
onBlur         | opt     | Validate when field loses focus
all            | opt     | All above modes combined

---

VALIDATION OBJECT PROPERTIES:

required       | boolean | Field must have a value
PURPOSE: Basic required field validation
APPLIES TO: All input components
EXAMPLE: {"name": "email", "required": true}

---

minLength      | number  | Minimum string/array length
PURPOSE: Validate minimum characters or array items
APPLIES TO: input-text, textarea, array, multiselect, checkbox-group
EXAMPLE: {"validation": {"minLength": 5, "message": "Minimum 5 characters"}}

---

maxLength      | number  | Maximum string/array length
PURPOSE: Validate maximum characters or array items
APPLIES TO: input-text, textarea, array, multiselect, checkbox-group
EXAMPLE: {"validation": {"maxLength": 100, "message": "Maximum 100 characters"}}

---

min            | number  | Minimum numeric value
PURPOSE: Validate minimum number
APPLIES TO: input-number, slider, rate, currency
EXAMPLE: {"validation": {"min": 0, "message": "Must be positive"}}

---

max            | number  | Maximum numeric value
PURPOSE: Validate maximum number
APPLIES TO: input-number, slider, rate, currency
EXAMPLE: {"validation": {"max": 100, "message": "Cannot exceed 100"}}

---

pattern        | string  | Regular expression pattern
PURPOSE: Validate string against regex
APPLIES TO: input-text, textarea, input-mask
FORMAT: Omit the / delimiters
EXAMPLE: {"validation": {"pattern": "[a-zA-Z0-9]+", "message": "Only letters and numbers"}}

---

message        | string/i18n | Error message to display
PURPOSE: Custom error message for any validation failure
FORMAT: String or i18n object
EXAMPLE: {"validation": {"minLength": 5, "message": {"en-US": "Too short", "es-ES": "Demasiado corto"}}}

---

validate       | string  | Custom JavaScript validation
PURPOSE: Complex validation logic
FORMAT: Single-line async function string
RETURNS: true/null/undefined (valid), false (invalid with default message), string/i18n (invalid with custom message)
AVAILABLE VARS: value (field value), formValues (all values), context() function
EXAMPLE: {"validation": {"validate": "if (value && !value.includes('@')) { return 'Invalid email format'; }"}}

========== END: VALIDATION RULES ==========

### VALIDATION EXAMPLES:

1. BASIC REQUIRED WITH MESSAGE:
{
  "name": "username",
  "required": true,
  "validation": {
    "message": "Username is required"
  }
}

2. STRING LENGTH VALIDATION:
{
  "name": "password",
  "required": true,
  "validation": {
    "minLength": 8,
    "maxLength": 20,
    "message": "Password must be 8-20 characters"
  }
}

3. PATTERN VALIDATION (EMAIL):
{
  "name": "email",
  "validation": {
    "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    "message": "Invalid email format"
  }
}

4. NUMERIC RANGE:
{
  "name": "age",
  "validation": {
    "min": 18,
    "max": 120,
    "message": "Age must be between 18 and 120"
  }
}

5. CUSTOM ASYNC VALIDATION:
{
  "name": "username",
  "validation": {
    "validate": "const exists = await fetch('/api/check-username?u=' + value); const data = await exists.json(); if (data.exists) { return 'Username already taken'; }"
  }
}

6. CONDITIONAL VALIDATION:
{
  "name": "state",
  "validation": {
    "validate": "if (formValues.country === 'US' && !value) { return 'State is required for US addresses'; }"
  }
}

7. EXTERNAL MODULE VALIDATION:
{
  "name": "creditCard",
  "validation": {
    "validate": "const { isValid } = await import('https://cdn.jsdelivr.net/npm/card-validator@9/+esm'); if (!isValid(value).isValid) { return 'Invalid credit card number'; }"
  }
}

8. I18N VALIDATION MESSAGE:
{
  "name": "phone",
  "validation": {
    "pattern": "^\\+?[1-9]\\d{1,14}$",
    "message": {
      "en-US": "Invalid phone number",
      "fr-FR": "Numéro de téléphone invalide",
      "es-ES": "Número de teléfono inválido"
    }
  }
}

### PROGRAMMATIC VALIDATION:

Change validation dynamically using scripts:
setParam('field', 'required', true);
setParam('field', 'validationMinLength', 10);
setParam('field', 'validationMaxLength', 50);
setParam('field', 'validationMin', 0);
setParam('field', 'validationMax', 100);
setParam('field', 'validationMessage', 'Custom error');
setParam('field', 'validationPattern', '^[A-Z]+$');

### VALIDATION ERROR OBJECT:

onError callback receives:
{
  "fieldName": {
    "label": "Field Label",
    "name": "fieldName",
    "errorMessage": "Validation error message"
  },
  "arrayField": {
    "label": "Array Field",
    "name": "arrayField",
    "errorMessage": "Array level error",
    "errorMessages": [
      {
        "nestedField": {
          "label": "Nested Field",
          "name": "nestedField",
          "errorMessage": "Nested error"
        }
      }
    ]
  }
}

## FORM CONTEXT REFERENCE

### Form Context Overview:
- External data passed to form for use in scripts and validation
- Accessible via context() function in scripts and validate functions
- Useful for dynamic validation, external data, API endpoints
- WARNING: Changing context values causes form re-render

========== START: FORM CONTEXT ==========

CONTEXT STRUCTURE:
Context is a key-value object passed to the form:
{
  "apiUrl": "https://api.example.com",
  "currentUser": "john@example.com",
  "validUsernames": ["john", "jane", "admin"],
  "maxFileSize": 5242880
}

---

ACCESSING CONTEXT:

In Scripts:
"script": "const api = context('apiUrl'); const user = context('currentUser');"

In Validation:
"validate": "const validUsers = context('validUsernames'); if (validUsers.includes(value)) { return 'Username already taken'; }"

---

CONTEXT BEST PRACTICES:

1. USE STABLE VALUES:
- Define context values outside of render cycles
- Avoid creating new objects/arrays for each render
- Use constants when possible

2. KEEP IT MINIMAL:
- Only include data needed for validation/scripts
- Don't pass large datasets
- Use API calls for dynamic data instead

3. STRUCTURE FOR CLARITY:
{
  "config": {
    "apiUrl": "https://api.example.com",
    "timeout": 5000
  },
  "validation": {
    "minAge": 18,
    "maxFileSize": 5242880
  },
  "options": {
    "countries": ["US", "UK", "CA"],
    "currencies": ["USD", "EUR", "GBP"]
  }
}

========== END: FORM CONTEXT ==========

### CONTEXT EXAMPLES:

1. EXTERNAL API VALIDATION:
Context:
{
  "apiBaseUrl": "https://api.example.com",
  "apiKey": "secret-key"
}

Validation:
{
  "validation": {
    "validate": "const url = context('apiBaseUrl') + '/validate-email'; const res = await fetch(url, {headers: {'X-API-Key': context('apiKey')}}); if (!res.ok) { return 'Email validation failed'; }"
  }
}

2. DYNAMIC OPTIONS FROM CONTEXT:
Context:
{
  "userRoles": ["admin", "editor", "viewer"],
  "departments": ["sales", "marketing", "engineering"]
}

Script:
"script": "if (userType === 'employee') { setParam('role', 'options', context('userRoles').map(r => ({value: r, label: r}))); }"

3. BUSINESS LOGIC RULES:
Context:
{
  "minOrderAmount": 50,
  "maxItemsPerOrder": 100,
  "shippingRates": {
    "standard": 5.99,
    "express": 15.99
  }
}

Validation:
"validate": "if (value < context('minOrderAmount')) { return 'Minimum order amount is $' + context('minOrderAmount'); }"

Script:
"script": "const rates = context('shippingRates'); if (shippingType) { setFieldValue('shippingCost', rates[shippingType] || 0); }"

4. USER PERMISSIONS:
Context:
{
  "currentUser": {
    "id": "123",
    "role": "manager",
    "permissions": ["read", "write", "delete"]
  }
}

Script:
"script": "const user = context('currentUser'); if (!user.permissions.includes('delete')) { hide('deleteButton'); disable('deleteOption'); }"

5. LOCALIZATION DATA:
Context:
{
  "translations": {
    "welcome": {
      "en-US": "Welcome",
      "es-ES": "Bienvenido",
      "fr-FR": "Bienvenue"
    }
  },
  "currentLocale": "en-US"
}

Script:
"script": "const t = context('translations'); const locale = context('currentLocale'); setParam('welcomeText', 'text', t.welcome[locale] || t.welcome['en-US']);"

6. CONFIGURATION LIMITS:
Context:
{
  "maxFileSize": 5242880, // 5MB
  "allowedFileTypes": [".pdf", ".doc", ".docx"],
  "maxUploads": 3
}

Validation:
"validate": "if (value && value.length > context('maxUploads')) { return 'Maximum ' + context('maxUploads') + ' files allowed'; }"

### CONTEXT GUIDELINES:

1. DON'T pass functions (not serializable)
2. DON'T modify context values from scripts
3. DON'T use context for form values (use field variables instead)
4. DO use context for configuration values
5. DO use context for external data references
6. DO keep context structure flat when possible

## QUICK REFERENCE TABLES

### 1. COMPONENT SELECTION GUIDE

| Data Need | Component Options | Value Type | Example Use Case |
|-----------|------------------|------------|------------------|
| Single line text | input-text | string | name, email, username |
| Multi-line text | textarea | string | description, comments |
| Number | input-number, slider | number | age, quantity, price |
| Currency | currency | number | price, salary, cost |
| Boolean | checkbox, toggle | boolean | agree, enable, active |
| Single choice | select, radio-group | string | country, gender, status |
| Multiple choice | multiselect, checkbox-group | array | interests, tags, skills |
| Date only | date | string (ISO) | birthdate, deadline |
| Date + time | datetime | string (ISO) | appointment, timestamp |
| Time only | time | string | duration, schedule |
| Rating | rate | number | review, satisfaction |
| File | upload | object/array | avatar, documents |
| Formatted text | input-mask | string | phone, SSN, credit card |
| Multiple items | array | array | contacts, addresses |
| Hidden data | hidden | any | userId, metadata |

### 2. LAYOUT COMPONENT GUIDE

| Layout Need | Component | Purpose | Can Contain |
|------------|-----------|---------|-------------|
| Group fields | group | Collapsible section | any |
| Side-by-side | columns | Multi-column layout | any |
| Multiple sections | tabs | Tabbed interface | any |
| Step-by-step | steps | Wizard/stepper | any |
| Repeating rows | array | Dynamic list | any |
| Visual separator | divider | Section break | none |
| Info text | placeholder | Markdown text | none |
| Image | placeholder-image | Display image | none |

### 3. SCRIPT FUNCTION COMPATIBILITY

| Component Type | setParam | setFieldValue | enable/disable | show/hide | style | arraySetParam |
|---------------|----------|---------------|----------------|-----------|-------|---------------|
| input-text | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| input-number | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| textarea | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| select | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| multiselect | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| checkbox | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| date/time | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| array | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ |
| group | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| columns | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| placeholder | ✓ (text) | ✗ | ✗ | ✓ | ✓ | ✗ |
| hidden | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |

### 4. VALIDATION COMPATIBILITY MATRIX

| Component | required | minLength | maxLength | min | max | pattern | validate |
|-----------|----------|-----------|-----------|-----|-----|---------|----------|
| input-text | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| input-number | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| textarea | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| select | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| multiselect | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| checkbox-group | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| date | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| currency | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| slider | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| array | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| hidden | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 5. COMMON PROPERTIES AVAILABILITY

| Property | Input Components | Layout Components | Display Components |
|----------|-----------------|-------------------|-------------------|
| name | Required | Optional | Optional |
| label | ✓ | ✓ | ✓ |
| hint | ✓ | ✓ | ✓ |
| disabled | ✓ | ✗ | ✗ |
| readOnly | ✓ | ✗ | ✗ |
| hidden | ✓ | ✓ | ✓ |
| required | ✓ | ✗ | ✗ |
| placeholder | Most | ✗ | ✗ |
| validation | ✓ | ✗ | ✗ |
| script | ✓ | Some | Some |

### 6. COMPONENT NESTING RULES

| Parent Component | Can Contain | Cannot Contain |
|-----------------|-------------|----------------|
| Form Root | Any component | - |
| group | Any component | - |
| columns | Any component (in fields object) | - |
| array | Any component (template) | - |
| tabs | Any component (in fields object) | - |
| steps | Any component (in fields object) | - |
| All input types | Nothing | Any component |
| placeholder | Nothing | Any component |
| divider | Nothing | Any component |

### 7. MANTINE SIZE OPTIONS

| Component Group | Size Options | Default |
|----------------|--------------|---------|
| Text inputs | xs, sm, md, lg, xl | sm |
| Buttons | xs, sm, md, lg, xl | sm |
| Select/Multi | xs, sm, md, lg, xl | sm |
| Checkbox/Radio | xs, sm, md, lg, xl | sm |
| Date pickers | xs, sm, md, lg, xl | sm |

### 8. SCRIPT VARIABLE ACCESS

| Variable | Type | Available In | Description |
|----------|------|--------------|-------------|
| [fieldName] | any | Scripts only | Direct field value access (current and other fields) |
| values | object | Scripts only | All form values object |
| **value** | any | **Validation only** | **Current field value (NOT available in scripts)** |
| **formValues** | object | **Validation only** | **All form values (same as `values` in scripts)** |
| context() | function | Scripts & validation | Access context data |

### 9. RETURN VALUE QUICK REFERENCE

| Component | Empty Value | Filled Example |
|-----------|-------------|----------------|
| input-text | "" | "john@email.com" |
| input-number | null | 42 |
| checkbox | false | true |
| select | null | "option1" |
| multiselect | [] | ["opt1", "opt2"] |
| date | null | "2024-03-15" |
| array | [] | [{field1: "val1"}] |
| upload (single) | null | {blobFile, name, fileKey} |
| upload (multi) | [] | [{blobFile, name, fileKey}] |

## ROOT FORM SCHEMA

### Form Schema Structure:
The root JSON object that defines the entire form

========== START: FORM SCHEMA PROPERTIES ==========

REQUIRED PROPERTIES:

version        | number  | req  | Schema version (always 2)
fields         | array   | req  | Array of component objects

OPTIONAL PROPERTIES:

$schema        | string  | opt  | JSON schema URL for validation
name           | string  | opt  | Form name/identifier
layout         | enum    | opt  | vertical,horizontal,inline
validationMode | enum    | opt  | onSubmit,onChange,onBlur,all
locales        | array   | opt  | Supported locales ["en-US","es-ES"]
disabled       | bool    | opt  | Disable entire form
readOnly       | bool    | opt  | Make entire form read-only
labelSubmit    | string  | opt  | Submit button text
labelCancel    | string  | opt  | Cancel button text
labelReset     | string  | opt  | Reset button text

MANTINE ROOT PROPERTIES:
fluid          | bool    | t    | Form takes full width
size           | enum    | sm   | xs,sm,md,lg,xl (global size)
requiredMark   | bool    | t    | Show asterisk on required fields

EXAMPLE:
{
  "$schema": "https://unpkg.com/lets-form/schemas/react-mantine/form.json",
  "version": 2,
  "name": "user_registration",
  "layout": "vertical",
  "validationMode": "onBlur",
  "locales": ["en-US", "es-ES"],
  "labelSubmit": "Register",
  "labelCancel": "Clear",
  "fields": [...]
}

========== END: FORM SCHEMA PROPERTIES ==========

## I18N INTERNATIONALIZATION

### i18n Object Format:
Any string property can be an i18n object instead of string

FORMAT:
{
  "en-US": "English text",
  "es-ES": "Texto en español",
  "fr-FR": "Texte en français"
}

SUPPORTED PROPERTIES:
- label
- hint
- placeholder
- text (placeholder component)
- validation.message
- labelSubmit/labelCancel/labelReset
- Any string in options arrays

EXAMPLE FIELD:
{
  "component": "input-text",
  "name": "firstName",
  "label": {
    "en-US": "First Name",
    "es-ES": "Nombre",
    "fr-FR": "Prénom"
  },
  "placeholder": {
    "en-US": "Enter your first name",
    "es-ES": "Ingrese su nombre",
    "fr-FR": "Entrez votre prénom"
  }
}

EXAMPLE VALIDATION:
{
  "validation": {
    "required": true,
    "message": {
      "en-US": "This field is required",
      "es-ES": "Este campo es obligatorio",
      "fr-FR": "Ce champ est obligatoire"
    }
  }
}

LOCALE DETECTION:
- If locale prop not set, auto-detects from browser
- Falls back to first available locale if current not found
- Falls back to raw string if no matching locale

## SPECIAL PATTERNS & NOTES

### DYNAMIC FIELD DEPENDENCIES:
Pattern for cascading fields:
1. Parent field changes
2. Script runs
3. Child field updates (options, visibility, etc.)

### ARRAY FIELD PATTERNS:
Arrays can return different formats:
- arrayOfObject (default): [{name:"John"}, {name:"Jane"}]
- arrayOfString: ["John", "Jane"] (single field only)
- commaSeparated: "John,Jane" (single field only)

### PERFORMANCE CONSIDERATIONS:
- onChange validation impacts performance
- Complex scripts on frequently changing fields slow form
- Large option arrays (1000+) impact select performance
- Deeply nested arrays can impact performance

### FORM DATA STRUCTURE:
Form submission returns object with field names as keys:
{
  "firstName": "John",
  "lastName": "Doe",
  "age": 30,
  "interests": ["sports", "music"],
  "address": {
    "street": "123 Main St",
    "city": "Boston"
  }
}

### FIELD NAME RESTRICTIONS:
- No dots (.) in names
- No brackets []
- No spaces
- Must be valid JavaScript identifiers
- Must be unique across entire form

### SCRIPT EXECUTION ORDER:
1. Field-level scripts run first (on field change)
2. Form-level scripts run on every change
3. Validation runs based on validationMode
4. Scripts can trigger other scripts (be careful of loops)

### COMMON GOTCHAS:
1. Scripts modifying own field = infinite loop
2. Context changes = full form re-render
3. Array indices change when items added/removed
4. Hidden fields still validate unless explicitly handled
5. Disabled fields don't submit values

## LETSFORM JSON NAVIGATION GUIDE

### JSONPath Query Patterns for LetsForm:
Strategic patterns for efficiently discovering and analyzing LetsForm JSON structures using nested syntax

========== START: LETSFORM JSONPATH PATTERNS ==========

### **DISCOVERY QUERIES (include_values: false)**

**Get all component types:**
```
$..[*].component
```

**Get all component names:**
```
$..[*][?(@.component)].name
```
*Only get names from objects that have component key*

**Get name and type of all the component together (MUST use this to get all the compoennts and its name):**
```
$..[*][?(@.component)].[name,component]
```

### **TARGETED QUERIES (include_values: true)**

**Find specific component by name:**
```
$..[*][?(@.component && @.name=='email')].[name,component]
```

**Find components by type:**
```
$..[*][?(@.component=='input-text')].[name,label,required]
```

**Search names with pattern:**
```
$..[*][?(@.component && @.name && @.name.includes('address'))].[name,component]
```

**Find components with specific properties:**
```
$..[*][?(@.component && @.validation)].[name,component,validation.required]
```

```
$..[*][?(@.component && @.options)].[name,component,options[0:2]]
```
**Find components by script content (useful for locating scripts that reference specific field names):**

```
$..[?(@.component && @.script && @.script.includes("actual_1"))].[script,name,component]
```

========== END: LETSFORM JSONPATH PATTERNS ==========

### **Query Strategy:**

1. **Use nested Always syntax** (`$..[*]`) to capture all components throughout form. This is important as most component will be nested inside
2. **Always check for component key** when getting names or searching
3. **Start with structure discovery** using include_values: false
4. **Use targeted queries** with selective properties to manage context size
5. **Search by patterns** when exploring unfamiliar forms

## END OF DOCUMENTATION
