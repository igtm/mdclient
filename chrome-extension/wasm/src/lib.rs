use wasm_bindgen::prelude::*;
use std::fs;
use comrak::{markdown_to_html, ComrakOptions, ComrakExtensionOptions, ComrakParseOptions, ComrakRenderOptions, ListStyleType};

use html5gum::{Token, Tokenizer};
use std::fmt::Write;

#[wasm_bindgen]
extern {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
pub fn convert_md2html(md: &str) -> String {
  let contents = String::from(md);

  // comrak
  let options = ComrakOptions {
      extension: ComrakExtensionOptions {
          strikethrough: true,
          tagfilter: true,
          table: true,
          autolink: true,
          tasklist: true,
          superscript: true,
          header_ids: None,
          footnotes: true,
          description_lists: true,
          front_matter_delimiter: Some("---".to_owned()),
          // front_matter_delimiter: cli.front_matter_delimiter,
          // #[cfg(feature = "shortcodes")]
          // shortcodes: cli.gemojis,
      },
      parse: ComrakParseOptions {
          smart: true,
          default_info_string: None,
          // relaxed_tasklist_matching: cli.relaxed_tasklist_character,
      },
      render: ComrakRenderOptions {
          hardbreaks: true,
          github_pre_lang: true,
          width: 20,
          unsafe_: true,
          escape: true,
          list_style: ListStyleType::Dash,
      },
  };
  let html = markdown_to_html(&contents, &options);

  // modify html
  let mut new_html = String::new();
  let mut heading_idx = 0;
  for token in Tokenizer::new(html.as_str()).infallible() {
      match token {
          Token::StartTag(tag) => {
            match String::from_utf8((&tag.name).to_vec()).unwrap().as_str() {
              "h1" | "h2" | "h3" | "h4" | "h5" | "h6" => {
                heading_idx += 1;
                // FIXME: tag.attributes
                write!(new_html, "<{} id=\"MDC__{}\">", String::from_utf8_lossy(&tag.name), heading_idx).unwrap();
              },
              x => {
                write!(new_html, "<{}>", String::from_utf8_lossy(&tag.name)).unwrap();
              },
            }
          }
          Token::String(hello_world) => {
              write!(new_html, "{}", String::from_utf8_lossy(&hello_world)).unwrap();
          }
          Token::EndTag(tag) => {
              write!(new_html, "</{}>", String::from_utf8_lossy(&tag.name)).unwrap();
          }
          _ => panic!("unexpected input"),
      }
  }
  return new_html;
}

#[wasm_bindgen]
pub fn get_heading_li(md: &str) -> String {
  let html = convert_md2html(md);
  // parser
  let mut found = false;
  let mut is_first = true;
  let mut headings: Vec<(i32, String)> = Vec::new();

  for token in Tokenizer::new(html.as_str()).infallible() {
      match token {
          Token::StartTag(tag) => {
              match String::from_utf8((&tag.name).to_vec()).unwrap().as_str() {
                  "h1" | "h2" | "h3" | "h4" | "h5" | "h6" => {
                    if !is_first || String::from_utf8_lossy(&tag.name) != "h1" {
                      let n = String::from_utf8_lossy(&tag.name).replace("h", "").parse::<i32>().unwrap();
                      headings.push((n , "".to_owned()));
                    }
                    found = true;
                    is_first = false;
                  }
                  _ => {}
              }
          }
          Token::String(hello_world) => {
              if found {
                if let Some(h) = headings.last_mut() {
                  h.1 = String::from_utf8((&hello_world).to_vec()).unwrap();
                }
              }
              found = false;
          }
          Token::EndTag(tag) => {}
          _ => panic!("unexpected input"),
      }
  }

  let mut topNum = 7; // h1
  for h in &headings {
    if topNum > h.0 {
      topNum = h.0;
    }
  }
  for h in headings.iter_mut() {
    h.0 -= topNum - 1;
  }

  let mut new_html = String::new();
  for (i, h) in (1_i32..).zip(headings.iter()) {
    write!(new_html, "{}", get_heading_li_recursive(&h, i));
  }

  println!("{:?}", &headings);
  return new_html;
}

fn get_heading_li_recursive(heading: &(i32, String), id: i32) -> String {
  if heading.0 == 1 {
    return format!("<li><a href=\"#MDC__{}\">{}</a></li>", id, heading.1);
  }
  return format!("<ul>{}</ul>", get_heading_li_recursive(&(heading.0 - 1, heading.1.to_owned()), id));
}

